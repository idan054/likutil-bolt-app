import { apiClient } from "../api/client";
import type {
  OrderDetails,
  OrderStatus,
  OrderSummary,
  LineItem,
} from "../../types/order";
import { JSONPath } from "jsonpath-plus";
import { getApiConfig } from "../api/config";
import { OrderDetails } from "../../components/OrderDetails";

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
  cacheDuration = CACHE_EXPIRATION
): Promise<T> => {
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
    status: order.status || "processing",
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
 * Gets orders by status
 */
export const getFilteredOrders = async (
  status: string | null,
  metadataConfigs?: MetadataConfig[],
  order_number?: string | null,
): Promise<OrderSummary[]> => {
  const config = getApiConfig();
  const platform = config.platform;
  const cacheKey = `orders_${platform}_${status || "all"}`;

  console.log(
    `[orders.service] Fetching processing orders for platform: ${platform}`
  );
  console.log("Metadata configs:", metadataConfigs);

  if (status === "init")
    status = JSON.parse(localStorage.getItem("selectedOrderStatus") ?? "null");
  console.log("Cache status:", status);

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
      `[orders.service] Retrieved ${orders.length} orders for status: ${
        status || "all"
      }`
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
          let order;
          
          if (platform === "shopify") {
          console.log(`B`);
            order = (await getFilteredOrders('null',undefined, orderId) as OrderDetails[])[0];
          } else {
              
              order = await getOrderById(orderId);
            }
            
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
 * Uses custom AJAX endpoint for custom statuses (like wc-acounting)
 * Falls back to standard WooCommerce API for standard statuses
 */
export const updateOrderStatus = async (
  orderId: string,
  status: string,
  note?: string
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

  // Check if this is a custom status that needs the custom AJAX endpoint
  const customStatuses = ["wc-acounting", "acounting"];
  const isCustomStatus = customStatuses.includes(status);

  if (isCustomStatus && platform === "woo") {
    // Use custom AJAX endpoint for custom statuses
    console.log(`[orders.service] Using custom AJAX endpoint for status: ${status}`);
    
    const wcSettings = JSON.parse(localStorage.getItem("wc_settings") || "{}");
    let storeUrl = wcSettings.storeUrl || "";
    
    if (!storeUrl) {
      throw new Error("Store URL not found in settings");
    }

    // Ensure www. prefix for CORS compatibility
    if (!storeUrl.startsWith("www.")) {
      storeUrl = "www." + storeUrl;
    }

    const ajaxUrl = `https://${storeUrl}/wp-admin/admin-ajax.php`;
    
    const formData = new FormData();
    formData.append("action", "likutil_update_order_status");
    formData.append("order_id", orderId);
    formData.append("status", status);
    if (note) {
      formData.append("note", note);
    }

    const response = await fetch(ajaxUrl, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.message || "Failed to update status");
    }

    console.log(`[orders.service] Order status updated via AJAX: ${result.data.new_status}`);
    
    // Refetch the order to get updated data
    return getOrderById(orderId);
  }

  // Standard WooCommerce/Shopify API for regular statuses
  const response = await apiClient<any>({
    method: platform === "shopify" ? "PUT" : "POST",
    path: `${PLATFORM_ENDPOINTS[platform].orders}/${orderId}`,
    body: { status },
  });

  console.log(`[orders.service] Order status updated successfully`);
  return mapOrder(response, platform) as OrderDetails;
};
