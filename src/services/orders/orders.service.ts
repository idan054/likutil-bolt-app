import { apiClient } from "../api/client";
import type {
  OrderDetails,
  OrderStatus,
  OrderSummary,
} from "../../types/order";
import { JSONPath } from "jsonpath-plus";

const ITEMS_PER_PAGE = 100;

// Request cache to prevent duplicate in-flight requests
const requestCache = new Map<string, Promise<any>>();
// Data cache to store responses
const dataCache = new Map<string, { data: any; timestamp: number }>();
// Cache expiration time (30 seconds)
const CACHE_EXPIRATION = 30 * 1000;

/**
 * Makes an API request with deduplication
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

export interface MetadataConfig {
  label_path?: string;
  value_path?: string;
  parent_path?: string;
}

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  const cacheKey = `order_${orderId}`;

  return dedupedApiRequest(cacheKey, () =>
    apiClient<OrderDetails>({
      method: "GET",
      path: `/orders/${orderId}`,
    })
  );
};

const buildMetadataEntry = (
  item: any,
  configs: { label_path?: string; value_path?: string; parent_path?: string }[]
) => {
  let newMetadata: { label: any; value: any }[] = [];

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
          const entry = { label, value: values[index] };

          // Ensure no duplicates
          if (
            !newMetadata.some(
              (existing) =>
                existing.label === entry.label && existing.value === entry.value
            )
          ) {
            newMetadata.push(entry);
          }
        }
      });
    });
  });

  // Filter out duplicates against existing metadata
  const existingMetadata = item.meta_data || [];
  return newMetadata.filter(
    (newEntry) =>
      !existingMetadata.some(
        (existing) =>
          existing.label === newEntry.label && existing.value === newEntry.value
      )
  );
};

const processMultiOrdersMetadata = (
  orders: OrderSummary[],
  configs: { label_path?: string; value_path?: string; parent_path?: string }[]
) => {
  if (!configs || configs.length === 0) return orders;

  let result = orders.map((order) => ({
    ...order,
    line_items: order.line_items.map((item) => ({
      ...item,
      meta_data: [
        ...(item.meta_data || []),
        ...buildMetadataEntry(item, configs),
      ],
    })),
  }));

  console.log("MULTI ORDERS METADATA EMBEDDED:", result);
  return result;
};

const processOrderMetadata = (
  order: OrderDetails,
  configs: { label_path?: string; value_path?: string; parent_path?: string }[]
) => {
  console.log("Processing order metadata...");

  if (!configs || configs.length === 0) return order;

  let result = {
    ...order,
    line_items: order.line_items.map((item) => ({
      ...item,
      meta_data: [
        ...(item.meta_data || []),
        ...buildMetadataEntry(item, configs),
      ],
    })),
  };

  console.log("1 ORDER METADATA EMBEDDED:", result);
  return result;
};

export const getProcessingOrders = async (
  metadataConfigs?: MetadataConfig[]
): Promise<OrderSummary[]> => {
  const cacheKey = "processing_orders";
  console.log("[orders.service] Fetching processing orders...");
  console.log("MULTI metadataConfigs", metadataConfigs);

  console.log(
    new Date().toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );

  return dedupedApiRequest(cacheKey, async () => {
    const params = new URLSearchParams({
      status: "processing",
      per_page: ITEMS_PER_PAGE.toString(),
      orderby: "date",
      order: "desc",
    });

    const response = await apiClient<OrderSummary[]>({
      method: "GET",
      path: `/orders/?${params.toString()}`,
    });

    return processMultiOrdersMetadata(response, metadataConfigs || []);
  });
};

export const searchOrderById = async (
  orderId: string,
  metadataConfigs?: MetadataConfig[]
): Promise<OrderDetails> => {
  const cacheKey = `search_order_${orderId}`;

  console.log("[orders.search.service] Searching order by ID:", orderId);
  console.log("metadataConfigs", metadataConfigs);

  // Validate settings before making the request
  const settings = localStorage.getItem("wc_settings");
  if (!settings) {
    throw new Error("WooCommerce settings not found");
  }

  return dedupedApiRequest(cacheKey, async () => {
    try {
      const response = await apiClient<OrderDetails>({
        method: "GET",
        path: `/orders/${orderId}`,
      });

      const orderDetails = processOrderMetadata(
        response,
        metadataConfigs || []
      );
      console.log("[orders.search.service] Search successful:", orderDetails);

      return orderDetails;
    } catch (error) {
      console.error("[orders.search.service] Search failed:", error);
      throw error;
    }
  });
};

export const getOrdersStatuses = async (): Promise<OrderStatus[]> => {
  const cacheKey = "order_statuses";

  return dedupedApiRequest(
    cacheKey,
    () =>
      apiClient<OrderStatus[]>({
        method: "GET",
        path: `/orders/statuses`,
      }),
    // Statuses change infrequently, so cache longer (5 minutes)
    5 * 60 * 1000
  );
};

export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<OrderDetails> => {
  console.log("[orders.service] Updating order status:", { orderId, status });

  // Clear any cached data for this order and processing orders
  dataCache.delete(`order_${orderId}`);
  dataCache.delete(`search_order_${orderId}`);
  dataCache.delete("processing_orders");

  const response = await apiClient<OrderDetails>({
    method: "POST",
    path: `/orders/${orderId}`,
    body: { status },
  });

  console.log("[orders.service] Order status updated:", response);
  return response;
};
