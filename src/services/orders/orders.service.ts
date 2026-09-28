import { apiClient } from "../api/client";
import type {
  OrderDetails,
  OrderStatus,
  OrderSummary,
  LineItem,
} from "../../types/order";
import { JSONPath } from "jsonpath-plus";
import { getApiConfig } from "../api/config";
import { settingsStorage } from "../settings";
import { assertOrderReady, getOrderBlockReason, isPickingStatus, OrderNotReadyError } from "./eligibility";

// Cache configuration
const ITEMS_PER_PAGE = 15;
const CACHE_EXPIRATION = 30 * 1000;
const STATUSES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request and data caching
const requestCache = new Map<string, Promise<any>>();
const dataCache = new Map<string, { data: any; timestamp: number }>();

// Platform-specific configuration
const PLATFORM_ENDPOINTS = {
  woo: {
    orders: "/orders",
    orderStatuses: "/orders/statuses",
  },
  shopify: {
    orders: "/shopify_orders",
    orderStatuses: "/shopify_orders/statuses",
  },
};

// Metadata configuration interface
export interface MetadataConfig {
  label_path?: string;
  value_path?: string;
  parent_path?: string;
}

/**
 * Makes an API request with deduplication and caching
 */
const dedupedApiRequest = <T>(
  key: string,
  requestFn: () => Promise<T>,
  cacheDuration = CACHE_EXPIRATION,
  forceRefresh = false,
): Promise<T> => {
  if (forceRefresh) {
    dataCache.delete(key);
    requestCache.delete(key);
  }
  // Check data cache first
  const cachedData = dataCache.get(key);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < cacheDuration) {
    // console.log(`[orders.service] Using cached data for ${key}`);
    return Promise.resolve(cachedData.data);
  }

  // Check if there's an in-flight request
  if (requestCache.has(key)) {
    // console.log(`[orders.service] Using in-flight request for ${key}`);
    return requestCache.get(key) as Promise<T>;
  }

  // Make new request
  const request = requestFn()
    .then((data) => {
      // Store in data cache
      // An older request must not repopulate a cache invalidated by a write/refresh.
      if (requestCache.get(key) === request) {
        dataCache.set(key, { data, timestamp: Date.now() });
        requestCache.delete(key);
      }
      return data;
    })
    .catch((error) => {
      // Clear from request cache on error
      if (requestCache.get(key) === request) requestCache.delete(key);
      throw error;
    });

  // Store in request cache
  requestCache.set(key, request);
  return request;
};

/**
 * Maps line item data from different platforms to a common format
 */
const mapLineItem = (item: any, platform: string): LineItem => {
  


  if (platform === "shopify") {
    const totalTax = item.tax_lines
      ? item.tax_lines
          .reduce((sum: number, t: any) => sum + parseFloat(t.price || "0"), 0)
          .toFixed(2)
      : "0";

    const metaData = item.properties
      ? item.properties.map((p: any) => ({
          id: Math.floor(Math.random() * 1000),
          key: p.name || "",
          value: p.value || "",
        }))
      : [];

    const productData = item.product_id
      ? {
          id: item.product_id,
          name: item.name || item.title || "",
          image: item.image || item.image || "",
          permalink: "",
          sku: item.sku || "",
          price: parseFloat(item.price || "0"),
          vendor: item.vendor || "", // Added vendor
          stock_quantity: item.stock_available,
          // stock_quantity: item.stock_available >= 0 ? item.stock_available : undefined,
        }
      : undefined;

      let shopify_item = {
        id: item.id,
        name: item.name || item.title || "",
        sku: item.sku || "",
        quantity: item.quantity,
        price: parseFloat(item.price || "0"),
        total: (parseFloat(item.price || "0") * item.quantity).toFixed(2),
        product_id: item.product_id || 0,
        variation_id: item.variant_id || undefined,
        tax_class: item.tax_lines?.[0]?.title || "",
        subtotal: item.price || "0",
        subtotal_tax: totalTax,
        total_tax: totalTax,
        image: item.image,
        product_data: productData,
        meta_data: metaData,
      };
      
      // console.log("SHOPIFY ITEM:", shopify_item);
      return shopify_item
    }
  

  // WooCommerce mapping (unchanged)
  return {
    id: item.id,
    name: item.name,
    sku: item.sku || "",
    quantity: item.quantity,
    price: parseFloat(item.price),
    total: item.total || (parseFloat(item.price) * item.quantity).toFixed(2),
    product_id: item.product_id,
    variation_id: item.variation_id,
    tax_class: item.tax_class || "",
    subtotal: item.subtotal || "",
    subtotal_tax: item.subtotal_tax || "0",
    total_tax: item.total_tax || "0",
    image: item.image,
    product_data: item.product_data,
    meta_data: item.meta_data || [],
  };
};

/**
 * Maps order data from different platforms to a common format
 */
const mapOrder = (
  order: any,
  platform: string
): OrderSummary | OrderDetails => {
  if (platform === "shopify") {
    // Helper function for address mapping with customer fallback
    const mapAddress = (address: any, isShipping = false) => ({
      first_name: address?.first_name || order.customer?.first_name || "",
      last_name: address?.last_name || order.customer?.last_name || "",
      company: address?.company || "",
      address_1: address?.address1 || "",
      address_2: address?.address2 || "",
      city: address?.city || "",
      state: address?.province || "",
      postcode: address?.zip || "",
      country: address?.country || address?.country_code || "",
      email: isShipping ? "" : address?.email || order.email || "",
      phone: address?.phone || order.phone || "",
    });

    // Billing address handling
    const billing = mapAddress(order.billing_address);

    // Shipping address handling with billing fallback
    const shippingAddress = order.shipping_address || order.billing_address;
    const shipping = mapAddress(shippingAddress, true);

    // Shipping calculations
    const shippingTotal = order.shipping_lines
      ? order.shipping_lines
          .reduce(
            (sum: number, sl: any) =>
              sum + parseFloat(sl.price || sl.total || "0"),
            0
          )
          .toFixed(2)
      : "0";

    const shippingLines = order.shipping_lines
      ? order.shipping_lines.map((sl: any) => ({
          method_id: sl.code || "shopify",
          method_title: sl.title || "Shopify Shipping",
          total: sl.price || "0",
  
        }))
      : [];

    // Status handling
    let status =
      [order.fulfillment_status, order.financial_status, order.status].find(
        (s) => s
      ) || "processing";

      // The items that retrive set on SERVER
      // Endpoint /shopify_orders?status=
      if (status !== "fulfilled") {
        status = "pending";
      }


    // Build base order
    return {
      id: order.id,
      order_number: order.order_number,
      status: status,
      shipment_created_status: order.shipment_created_status,
      total: order.total_price || order.total || "0",
      customer_id: order.customer?.id || null,
      date_created: order.created_at || order.date_created,
      billing,
      shipping,
      customer_note: order.note || "",
      shipping_total: shippingTotal,
      payment_method: order.gateway || "",
      payment_method_title: order.payment_gateway_names?.[0] || "",
      shipping_lines: shippingLines,
      line_items: (order.line_items || []).map((item: any) =>
        mapLineItem(item, platform)
      ),
      tax_exempt: order.tax_exempt || false,
      tags: order.tags ? order.tags.split(", ") : [],
      s3_print: order.s3_print ?? null,
      s3_label_url: order.s3_label_url ?? null,
    };
  }
// --------------------------------------------------
// --------------------------------------------------
  // WooCommerce mapping (unchanged)
  const billing = {
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    email: "",
    phone: "",
  };

  const shipping = {
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
    phone: "",
  };

  if (order.billing) {
    billing.first_name = order.billing.first_name || "";
    billing.last_name = order.billing.last_name || "";
    billing.company = order.billing.company || "";
    billing.address_1 = order.billing.address_1 || "";
    billing.address_2 = order.billing.address_2 || "";
    billing.city = order.billing.city || "";
    billing.state = order.billing.state || "";
    billing.postcode = order.billing.postcode || "";
    billing.country = order.billing.country || "";
    billing.email = order.billing.email || "";
    billing.phone = order.billing.phone || "";
  }

  if (order.shipping) {
    shipping.first_name = order.shipping.first_name || "";
    shipping.last_name = order.shipping.last_name || "";
    shipping.company = order.shipping.company || "";
    shipping.address_1 = order.shipping.address_1 || "";
    shipping.address_2 = order.shipping.address_2 || "";
    shipping.city = order.shipping.city || "";
    shipping.state = order.shipping.state || "";
    shipping.postcode = order.shipping.postcode || "";
    shipping.country = order.shipping.country || "";
    shipping.phone = order.shipping.phone || "";
  }

  // Ensure GMT dates are properly marked as UTC by appending 'Z' if missing
  // This is needed because WooCommerce returns date_created_gmt without timezone suffix
  const ensureUtcSuffix = (dateStr: string): string => {
    if (!dateStr) return dateStr;
    // If it doesn't end with Z or timezone offset (+HH:mm), add Z
    if (!/[Zz]$/.test(dateStr) && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr + 'Z';
    }
    return dateStr;
  };

  return {
    id: order.id,
    is_vip_member:
      typeof order.is_vip_member === "boolean"
        ? order.is_vip_member
        : undefined,
    status: order.status || "unknown",
    shipment_created_status: order.shipment_created_status,
    total: order.total || "0",
    customer_id: order.customer_id || null,
    date_created: ensureUtcSuffix(order.date_created_gmt),
    date_modified: ensureUtcSuffix(order.date_modified_gmt),
    date_completed: ensureUtcSuffix(order.date_completed_gmt),
    billing,
    shipping,
    customer_note: order.customer_note || "",
    shipping_total: order.shipping_total || "0",
    payment_method: order.payment_method || "",
    payment_method_title: order.payment_method_title || "",
    shipping_lines:
      order.shipping_lines?.map((sl: any) => ({
        method_id: sl.method_id || "flat_rate",
        method_title: sl.method_title || "Flat Rate",
        instance_id: sl.instance_id ?? undefined,
        total: sl.total || "0",
      })) || [],
    line_items: (order.line_items || []).map((item: any) =>
      mapLineItem(item, platform)
    ),
    s3_print: order.s3_print ?? null,
    s3_label_url: order.s3_label_url ?? null,
  };
};

const orderCacheScope = (platform: string, baseUrl: string) =>
  JSON.stringify([
    platform,
    baseUrl,
    settingsStorage.get()?.storeUrl,
    settingsStorage.get()?.myShopifyUrl,
  ]);

const orderCacheKey = (kind: string, orderId: string, platform: string, baseUrl: string) =>
  `${orderCacheScope(platform, baseUrl)}:${kind}:${orderId}`;

const invalidateOrderCaches = (scope: string, orderId: string) => {
  for (const key of new Set([...dataCache.keys(), ...requestCache.keys()])) {
    if (key.startsWith(`${scope}:orders:`) ||
        key === `${scope}:order:${orderId}` || key === `${scope}:search:${orderId}`) {
      dataCache.delete(key);
      requestCache.delete(key);
    }
  }
};

/**
 * Builds metadata entries from configurations
 */
const buildMetadataEntry = (
  item: any,
  configs: MetadataConfig[],
  platform: string
) => {
  let newMetadata: Array<{ label: string; value: any }> = [];

  configs.forEach((config) => {
    if (!config.parent_path) {
      console.error("Missing parent_path in config:", config);
      return;
    }

    // Get parent objects using parent_path
    const parents = JSONPath({ path: config.parent_path, json: item });

    parents.forEach((parent) => {
      // Extract labels & values within the same parent object
      const labels = config.label_path
        ? JSONPath({ path: config.label_path, json: parent })
        : [];
      const values = config.value_path
        ? JSONPath({ path: config.value_path, json: parent })
        : [];

      // Pair labels with their corresponding values
      labels.forEach((label, index) => {
        if (values[index] !== undefined) {
          newMetadata.push({ label, value: values[index] });
        }
      });
    });
  });

  // Get existing metadata based on platform
  const existingMetadata =
    platform === "shopify" ? item.properties || [] : item.meta_data || [];

  // Filter out duplicates against existing metadata
  return newMetadata.filter(
    (newEntry) =>
      !existingMetadata.some(
        (existing) =>
          (existing.key === newEntry.label &&
            existing.value === newEntry.value) ||
          (existing.name === newEntry.label &&
            existing.value === newEntry.value)
      )
  );
};

/**
 * Processes metadata for a single order
 */
const processOrderMetadata = (
  order: OrderDetails,
  configs: MetadataConfig[],
  platform: string
): OrderDetails => {
  console.log("Processing order metadata...");

  if (!configs || configs.length === 0) return order;

  const result = {
    ...order,
    line_items: order.line_items.map((item) => ({
      ...item,
      meta_data: [
        ...(item.meta_data || []),
        ...buildMetadataEntry(item, configs, platform).map((entry) => ({
          id: Math.floor(Math.random() * 1000),
          key: entry.label,
          value: entry.value,
        })),
      ],
    })),
  };

  console.log("ORDER METADATA EMBEDDED:", result);
  return result;
};

/**
 * Processes metadata for multiple orders
 */
const processMultiOrdersMetadata = (
  orders: OrderSummary[],
  configs: MetadataConfig[],
  platform: string
): OrderSummary[] => {
  console.log("Processing multiple orders metadata...");

  if (!configs || configs.length === 0) return orders;

  const result = orders.map((order) => ({
    ...order,
    line_items: order.line_items.map((item) => ({
      ...item,
      meta_data: [
        ...(item.meta_data || []),
        ...buildMetadataEntry(item, configs, platform).map((entry) => ({
          id: Math.floor(Math.random() * 1000),
          key: entry.label,
          value: entry.value,
        })),
      ],
    })),
  }));

  console.log("MULTI ORDERS METADATA EMBEDDED:", result);
  return result;
};

/**
 * Gets an order by ID
 */
export const getOrderById = async (orderId: string, forceRefresh = false): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = orderCacheKey("order", orderId, platform, config.baseUrl);

  console.log(
    `[orders.service] Getting order by ID: ${orderId} for platform: ${platform}`
  );

  

  const loadOrder = async () => {
    const response = await apiClient<any>({
      method: "GET",
      path: `${PLATFORM_ENDPOINTS[platform].orders}/${orderId}`,
      cache: forceRefresh ? "no-store" : undefined,
    });

    assertOrderReady(response, platform);
    return mapOrder(response, platform) as OrderDetails;
  };

  return dedupedApiRequest(cacheKey, loadOrder, CACHE_EXPIRATION, forceRefresh);
};

/**
 * Gets orders by status
 */
export interface OrdersPage {
  orders: OrderSummary[];
  total: number | null;
  status: string | null;
}

export const getFilteredOrdersPage = async (
  status: string | null,
  metadataConfigs?: MetadataConfig[],
  order_number?: string | null,
  requestOptions: { forceRefresh?: boolean; signal?: AbortSignal } = {},
): Promise<OrdersPage> => {
  const config = getApiConfig();
  const platform = config.platform;

  console.log(
    `[orders.service] Fetching processing orders for platform: ${platform}`
  );
  console.log("Metadata configs:", metadataConfigs);

  if (status === "init")
    status = JSON.parse(localStorage.getItem("selectedOrderStatus") ?? "null");
  status = status && status !== "null" ? status : null;
  if (status && !isPickingStatus(status, platform)) {
    return { orders: [], total: 0, status };
  }
  console.log("Cache status:", status);

  const cacheKey = orderCacheKey("orders", JSON.stringify([
    status, order_number, metadataConfigs,
  ]), platform, config.baseUrl);
  return dedupedApiRequest(cacheKey, async () => {
    // Platform-specific parameters
    const params = new URLSearchParams({
      [platform === "shopify" ? "limit" : "per_page"]:
        ITEMS_PER_PAGE.toString(),
      orderby: "date",
      order: "desc",
    });

    if (status && status !== "null") {
      params.append("status", status);
    }

    if (order_number && order_number !== "null") {
      params.append("order_name", order_number);
    }

    // Special case for Shopify
    if (platform === "shopify") {
      const wcSettings = JSON.parse(localStorage.getItem("wc_settings"));

      if (wcSettings && wcSettings.storeUrl) {
        const shopId = new URL(`https://${wcSettings.myShopifyUrl}`).hostname.split(
          "."
        )[0];
        
        params.set("shopId", shopId); // Dynamically setting shopId
      } else {
        console.warn("wc_settings not found or storeUrl is missing.");
      }
    }
    let responseTotal: number | null = null;
    let hasMore = true;
    let excluded = false;
    let scanned = 0;
    const eligibleOrders: OrderSummary[] = [];
    const seen = new Set<number>();
    // Filtering only page one can falsely report an empty warehouse queue.
    // Woo supports page pagination; bound reads and never report a partial scan as empty.
    const maxPages = platform === "woo" ? 5 : 1;
    for (let page = 1; page <= maxPages && hasMore && eligibleOrders.length < ITEMS_PER_PAGE; page++) {
      if (page > 1) params.set("page", String(page));
      const response = await apiClient<any>({
        method: "GET",
        path: `${PLATFORM_ENDPOINTS[platform].orders}?${params.toString()}`,
        signal: requestOptions.signal,
        cache: "no-store",
        onResponse: ({ headers }) => {
          const value = headers.get("X-WP-Total");
          if (value !== null && /^\d+$/.test(value)) responseTotal = Number(value);
        },
      });
      const rawOrders = platform === "shopify" && Array.isArray(response?.orders)
        ? response.orders : response;
      if (!Array.isArray(rawOrders)) {
        throw new Error("לא התקבלה רשימת הזמנות תקינה מהחנות. יש לנסות לרענן שוב.");
      }
      const bodyTotal = response?.total_count ?? response?.total;
      const parsedTotal = bodyTotal == null ? NaN : Number(bodyTotal);
      if (responseTotal === null && Number.isSafeInteger(parsedTotal) && parsedTotal >= rawOrders.length) {
        responseTotal = parsedTotal;
      }
      scanned += rawOrders.length;
      hasMore = rawOrders.length === ITEMS_PER_PAGE && (responseTotal === null || scanned < responseTotal);
      for (const rawOrder of rawOrders) {
        if (getOrderBlockReason(rawOrder, platform)) {
          excluded = true;
          continue;
        }
        if (!seen.has(rawOrder.id)) {
          seen.add(rawOrder.id);
          eligibleOrders.push(mapOrder(rawOrder, platform) as OrderSummary);
        }
      }
    }
    if (!eligibleOrders.length && hasMore) {
      throw new Error("הבדיקה טרם הגיעה להזמנות מאושרות. בחרו בסינון בטיפול כדי לטעון את תור הליקוט.");
    }
    const orders = eligibleOrders.slice(0, ITEMS_PER_PAGE);

    console.log(
      `[orders.service] Retrieved ${orders.length} orders for status: ${
        status || "all"
      }`
    );

    const mappedOrders = metadataConfigs?.length
      ? processMultiOrdersMetadata(orders, metadataConfigs, platform)
      : orders;
    return {
      orders: mappedOrders,
      total: !hasMore ? eligibleOrders.length :
        (status && !excluded && platform === "woo" ? responseTotal : null),
      status,
    };
  }, CACHE_EXPIRATION, requestOptions.forceRefresh);
};

export const getFilteredOrders = async (
  status: string | null,
  metadataConfigs?: MetadataConfig[],
  order_number?: string | null,
): Promise<OrderSummary[]> =>
  (await getFilteredOrdersPage(status, metadataConfigs, order_number)).orders;

/**
 * Searches for an order by ID with optional metadata processing
 */
export const searchOrderById = async (
  orderId: string,
  metadataConfigs?: MetadataConfig[]
): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = orderCacheKey("search", orderId, platform, config.baseUrl);

  console.log(
    `[orders.search.service] Searching for order ID: ${orderId} on platform: ${platform}`
  );

  
  return dedupedApiRequest(cacheKey, async () => {
    try {
          let order;
          
          if (platform === "shopify") {
          console.log(`B`);
            order = (await getFilteredOrdersPage(null, undefined, orderId, { forceRefresh: true })).orders[0] as OrderDetails;
          } else {
              order = await getOrderById(orderId, true);
            }
      if (!order) throw new OrderNotReadyError(orderId, "לא נמצאה הזמנה מאושרת לליקוט. יש לפנות למשרד.");
      return processOrderMetadata(order, metadataConfigs || [], platform);
    } catch (error) {
      console.error(
        `[orders.search.service] Failed to find order ${orderId}:`,
        error
      );
      throw error;
    }
  }, CACHE_EXPIRATION, true);
};

/**
 * Gets all available order statuses
 */
export const getOrdersStatuses = async (): Promise<OrderStatus[]> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = `statuses_${platform}`;

  console.log(
    `[orders.service] Getting order statuses for platform: ${platform}`
  );

  return dedupedApiRequest(
    cacheKey,
    async () => {
      // Default statuses for WooCommerce
      if (platform === "woo") {
        try {
          const response = await apiClient<OrderStatus[]>({
            method: "GET",
            path: PLATFORM_ENDPOINTS.woo.orderStatuses,
          });
          return response;
        } catch (error) {
          console.error(
            "Failed to fetch WooCommerce statuses, using fallback",
            error
          );
          return [
            { slug: "pending", name: "Pending" },
            { slug: "processing", name: "Processing" },
            { slug: "completed", name: "Completed" },
            { slug: "cancelled", name: "Cancelled" },
          ];
        }
      }

      // Shopify statuses
      try {
        const response = await apiClient<any>({
          method: "GET",
          path: PLATFORM_ENDPOINTS.shopify.orderStatuses,
        });
        return response.statuses || [];
      } catch (error) {
        console.error(
          "Failed to fetch Shopify statuses, using fallback",
          error
        );
        const shopifyStatuses: OrderStatus[] = [
        // { slug: 'fulfilled', name: 'הושלם' },
        // { slug: 'paid', name: 'ממתין לתשלום' },

        { slug: 'pending', name: 'בטיפול' },
        { slug: 'fulfilled', name: 'הושלם' },
        // { slug: 'pending', name: 'ממתין לתשלום' },
        // { slug: 'on-hold', name: 'ממתין' },
        // { slug: 'cancelled', name: 'בוטל' },
        // { slug: 'refunded', name: 'הוחזר' },
        // { slug: 'failed', name: 'נכשל' },
        // { slug: 'draft', name: 'טיוטה' },
      ];
      return shopifyStatuses
      }
    },
    STATUSES_CACHE_DURATION // Cache statuses longer
  );
};

/**
 * Updates an order's status
 * Custom statuses like 'acounting' are handled by PHP filter on WordPress
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  note?: string,
  expectedStatus?: string,
): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;

  console.log(
    `[orders.service] Updating order ${orderId} status to ${status} on platform ${platform}`
  );

  const scope = orderCacheScope(platform, config.baseUrl);
  invalidateOrderCaches(scope, orderId);

  // Standard WooCommerce/Shopify API call
  try {
    // Picker controls must never turn an unapproved quote/order into an approved one.
    const current = await getOrderById(orderId, true);
    const currentConfig = getApiConfig();
    if (scope !== orderCacheScope(currentConfig.platform, currentConfig.baseUrl)) {
      throw new Error("החנות הוחלפה במהלך העדכון. יש לחזור לחנות המקורית ולנסות שוב.");
    }
    // A second worker may already have advanced the shipment while we were reading.
    if (expectedStatus && current.status !== expectedStatus) return current;
    const response = await apiClient<any>({
      method: platform === "shopify" ? "PUT" : "POST",
      path: `${PLATFORM_ENDPOINTS[platform].orders}/${orderId}`,
      body: { status },
    });

    return mapOrder(response, platform) as OrderDetails;
  } finally {
    // A lost response can follow a committed write. Reconcile by reading, never
    // automatically repeat the mutation, and discard reads started during it.
    invalidateOrderCaches(scope, orderId);
  }
};

/** Advance a confirmed shipment using the store's policy, without recreating it. */
export const markOrderShipmentCreated = async (orderId: string): Promise<OrderDetails> => {
  const config = getApiConfig();
  const scope = orderCacheScope(config.platform, config.baseUrl);
  const fresh = await getOrderById(orderId, true);
  const target = fresh.shipment_created_status || "completed";
  if (!isPickingStatus(target, config.platform) || ["processing", "pending"].includes(target)) {
    throw new Error("לא הוגדר בחנות סטטוס תקין לאחר יצירת משלוח. יש לפנות למשרד.");
  }
  const currentConfig = getApiConfig();
  if (scope !== orderCacheScope(currentConfig.platform, currentConfig.baseUrl)) {
    throw new Error("החנות הוחלפה במהלך העדכון. יש לחזור לחנות המקורית ולנסות שוב.");
  }
  if (fresh.status === target) return fresh;
  const isSaved = (order: OrderDetails) => order.status === target ||
    (order.status === order.shipment_created_status && !["processing", "pending"].includes(order.status));
  try {
    const updated = await updateOrderStatus(orderId, target, undefined, fresh.status);
    if (!isSaved(updated)) throw new Error("החנות לא אישרה את שינוי סטטוס המשלוח.");
    return updated;
  } catch (error) {
    // The write may have succeeded even when its reply was lost. Read once;
    // retrying this operation must never call the carrier again.
    const latestConfig = getApiConfig();
    if (scope === orderCacheScope(latestConfig.platform, latestConfig.baseUrl)) {
      try {
        const saved = await getOrderById(orderId, true);
        if (isSaved(saved)) return saved;
      } catch { /* Keep the original failure. */ }
    }
    throw error;
  }
};

/**
 * Adds/updates post-meta on a WooCommerce order (idempotent by meta key).
 * WooCommerce REST matches meta_data entries by `key`, so re-sending the same
 * keys overwrites the existing values without touching other meta. HPOS-safe.
 * Only supported for WooCommerce stores; no-op for other platforms.
 */
export const updateOrderMeta = async (
  orderId: string,
  meta: Array<{ key: string; value: string }>
): Promise<void> => {
  const config = getApiConfig();
  const platform = config.platform;

  if (platform !== "woo") {
    console.log(
      `[orders.service] updateOrderMeta skipped: unsupported platform ${platform}`
    );
    return;
  }

  // Invalidate caches so the next read reflects the new meta
  dataCache.delete(orderCacheKey("order", orderId, platform, config.baseUrl));
  dataCache.delete(orderCacheKey("search", orderId, platform, config.baseUrl));

  await apiClient<any>({
    method: "PUT",
    path: `${PLATFORM_ENDPOINTS.woo.orders}/${orderId}`,
    body: { meta_data: meta },
  });

  console.log(
    `[orders.service] Order ${orderId} meta updated:`,
    meta.map((m) => m.key)
  );
};
