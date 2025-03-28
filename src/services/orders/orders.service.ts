import { apiClient } from "../api/client";
import type {
  OrderDetails,
  OrderStatus,
  OrderSummary,
  LineItem,
} from "../../types/order";
import { JSONPath } from "jsonpath-plus";
import { getApiConfig } from "../api/config";

// Cache configuration
const ITEMS_PER_PAGE = 100;
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
  cacheDuration = CACHE_EXPIRATION
): Promise<T> => {
  // Check data cache first
  const cachedData = dataCache.get(key);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < cacheDuration) {
    console.log(`[orders.service] Using cached data for ${key}`);
    return Promise.resolve(cachedData.data);
  }

  // Check if there's an in-flight request
  if (requestCache.has(key)) {
    console.log(`[orders.service] Using in-flight request for ${key}`);
    return requestCache.get(key) as Promise<T>;
  }

  // Make new request
  const request = requestFn()
    .then((data) => {
      // Store in data cache
      dataCache.set(key, { data, timestamp: Date.now() });
      // Clear from request cache
      requestCache.delete(key);
      return data;
    })
    .catch((error) => {
      // Clear from request cache on error
      requestCache.delete(key);
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
          name: item.title || item.name || "",
          permalink: "",
          sku: item.sku || "",
          price: parseFloat(item.price || "0"),
          vendor: item.vendor || "", // Added vendor
          stock_quantity: undefined,
        }
      : undefined;

    return {
      id: item.id,
      name: item.title || item.name || "",
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
      image: item.image
        ? {
            src: item.image.src || "",
            alt: item.image.alt || "",
          }
        : undefined,
      product_data: productData,
      meta_data: metaData,
    };
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
    const status =
      [order.fulfillment_status, order.financial_status, order.status].find(
        (s) => s
      ) || "processing";

    // Build base order
    return {
      id: order.id,
      status: status,
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
    };
  }



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


// Convert to Date object
const gmtDate = new Date(order.date_created_gmt);
const timezoneOffset = new Date().getTimezoneOffset();
const localDate = new Date(gmtDate.getTime() - timezoneOffset * 60000);


  return {
    id: order.id,
    status: order.status || "processing",
    total: order.total || "0",
    customer_id: order.customer_id || null,
    // date_created: order.date_created,
    date_created: localDate.toLocaleString() , // Convert to local time
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
        total: sl.total || "0",
      })) || [],
    line_items: (order.line_items || []).map((item: any) =>
      mapLineItem(item, platform)
    ),
  };
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
export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = `order_${platform}_${orderId}`;

  console.log(
    `[orders.service] Getting order by ID: ${orderId} for platform: ${platform}`
  );

  return dedupedApiRequest(cacheKey, async () => {
    const response = await apiClient<any>({
      method: "GET",
      path: `${PLATFORM_ENDPOINTS[platform].orders}/${orderId}`,
    });

    return mapOrder(response, platform) as OrderDetails;
  });
};

/**
 * Gets all processing orders
 */
export const getProcessingOrders = async (
  metadataConfigs?: MetadataConfig[]
): Promise<OrderSummary[]> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = `processing_orders_${platform}`;

  console.log(
    `[orders.service] Fetching processing orders for platform: ${platform}`
  );
  console.log("Metadata configs:", metadataConfigs);

  return dedupedApiRequest(cacheKey, async () => {
    // Platform-specific parameters
    const params = new URLSearchParams({
      [platform === "shopify" ? "limit" : "per_page"]:
        ITEMS_PER_PAGE.toString(),
      status: "processing",
      orderby: "date",
      order: "desc",
    });

    // Special case for Shopify
    if (platform === "shopify") {
      params.set("shopId", "likutil-tests"); // This might need to be configurable
    }

    const response = await apiClient<any>({
      method: "GET",
      path: `${PLATFORM_ENDPOINTS[platform].orders}?${params.toString()}`,
    });

    // Handle different response formats
    let orders: OrderSummary[] = [];

    if (platform === "shopify" && response.orders) {
      // Shopify returns { orders: [...] }
      orders = response.orders.map(
        (order: any) => mapOrder(order, platform) as OrderSummary
      );
    } else if (Array.isArray(response)) {
      // WooCommerce returns an array
      orders = response.map(
        (order) => mapOrder(order, platform) as OrderSummary
      );
    }

    console.log(
      `[orders.service] Retrieved ${orders.length} processing orders`
    );

    return metadataConfigs?.length
      ? processMultiOrdersMetadata(orders, metadataConfigs, platform)
      : orders;
  });
};

/**
 * Searches for an order by ID with optional metadata processing
 */
export const searchOrderById = async (
  orderId: string,
  metadataConfigs?: MetadataConfig[]
): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = `search_${platform}_${orderId}`;

  console.log(
    `[orders.search.service] Searching for order ID: ${orderId} on platform: ${platform}`
  );

  return dedupedApiRequest(cacheKey, async () => {
    try {
      const order = await getOrderById(orderId);
      return processOrderMetadata(order, metadataConfigs || [], platform);
    } catch (error) {
      console.error(
        `[orders.search.service] Failed to find order ${orderId}:`,
        error
      );
      throw error;
    }
  });
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
        return [
          { slug: "processing", name: "Processing" },
          { slug: "fulfilled", name: "Fulfilled" },
          { slug: "paid", name: "Paid" },
          { slug: "cancelled", name: "Cancelled" },
        ];
      }
    },
    STATUSES_CACHE_DURATION // Cache statuses longer
  );
};

/**
 * Updates an order's status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<OrderDetails> => {
  const config = getApiConfig();
  const platform = config.platform;

  console.log(
    `[orders.service] Updating order ${orderId} status to ${status} on platform ${platform}`
  );

  // Clear relevant caches
  dataCache.delete(`order_${platform}_${orderId}`);
  dataCache.delete(`search_${platform}_${orderId}`);
  dataCache.delete(`processing_orders_${platform}`);

  const response = await apiClient<any>({
    method: platform === "shopify" ? "PUT" : "POST",
    path: `${PLATFORM_ENDPOINTS[platform].orders}/${orderId}`,
    body: { status },
  });

  console.log(`[orders.service] Order status updated successfully`);
  return mapOrder(response, platform) as OrderDetails;
};
