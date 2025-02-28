import { apiClient } from '../api/client';
import type { OrderDetails, OrderStatus, OrderSummary } from '../../types/order';
import { JSONPath } from 'jsonpath-plus';
import { useGetFirebaseMetadata } from '../../hooks/useGetFirebaseMetadata';

const ITEMS_PER_PAGE = 100;

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  return apiClient<OrderDetails>({
    method: 'GET',
    path: `/orders/${orderId}`,
  });
};


export interface MetadataConfig {
  label_path?: string;
  value_path?: string;
  parent_path?: string;
}

const buildMetadataEntry = (
  item: any,
  configs: { label_path?: string; value_path?: string; parent_path?: string }[]
) => {

  // ADD THIS SIGN TOO!!!!
  // Add the path_value. this will helps know which metadata is based on the path
  // And those will eb shown in the order details page!
  // let newMetadata: { label: any; value: any path_based}[] = [];

  let newMetadata: { label: any; value: any }[] = [];

  configs.forEach((config) => {
    if (!config.parent_path) {
      console.error('Missing parent_path in config:', config);
      return;
    }

    // Get parent objects using parent_path
    const parents = JSONPath({ path: config.parent_path, json: item });

    parents.forEach((parent) => {
      // Extract labels & values within the same parent object
      const labels = config.label_path ? JSONPath({ path: config.label_path, json: parent }) : [];
      const values = config.value_path ? JSONPath({ path: config.value_path, json: parent }) : [];

      // Pair labels with their corresponding values
      labels.forEach((label, index) => {
        if (values[index] !== undefined) {
          const entry = { label, value: values[index] };

          // Ensure no duplicates
          if (!newMetadata.some((existing) => existing.label === entry.label && existing.value === entry.value)) {
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
        (existing) => existing.label === newEntry.label && existing.value === newEntry.value
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
      meta_data: [...(item.meta_data || []), ...buildMetadataEntry(item, configs)]
    }))
  }));

  console.log('MULTI ORDERS METADATA EMBEDDED:', result);
  return result;
};

const processOrderMetadata = (
  order: OrderDetails,
  configs: { label_path?: string; value_path?: string; parent_path?: string }[]
) => {
  console.log('Processing order metadata...');

  if (!configs || configs.length === 0) return order;

  let result = {
    ...order,
    line_items: order.line_items.map((item) => ({
      ...item,
      meta_data: [...(item.meta_data || []), ...buildMetadataEntry(item, configs)]
    }))
  };

  console.log('1 ORDER METADATA EMBEDDED:', result);
  return result;
};






export const getProcessingOrders = async (metadataConfigs?: MetadataConfig[]): Promise<OrderSummary[]> => {
  console.log('[orders.service] Fetching processing orders...');
  console.log('MULTI metadataConfigs', metadataConfigs);

  console.log(new Date().toLocaleString('he-IL', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }));

  const params = new URLSearchParams({
    status: 'processing',
    per_page: ITEMS_PER_PAGE.toString(),
    orderby: 'date',
    order: 'desc',
  });


      // Convert saved path configurations to the required format
  return apiClient<OrderSummary[]>({
    method: 'GET',
    path: `/orders/?${params.toString()}`,
  }).then(response => processMultiOrdersMetadata(response, metadataConfigs || []));
};

export const searchOrderById = async (orderId: string, metadataConfigs?: MetadataConfig[]): Promise<OrderDetails> => {

  console.log('[orders.search.service] Searching order by ID:', orderId);
  console.log('metadataConfigs', metadataConfigs);


  // Validate settings before making the request
  const settings = localStorage.getItem('wc_settings');
  if (!settings) {
    throw new Error('WooCommerce settings not found');
  }

  try {
      let orderDetails = await apiClient<OrderDetails>({
        method: 'GET',
        path: `/orders/${orderId}`,
      }).then(response => processOrderMetadata(response, metadataConfigs || []));

      console.log('[orders.search.service] Search successful:', orderDetails);

    return orderDetails
  } catch (error) {
    console.error('[orders.search.service] Search failed:', error);
    throw error;
  }
};

export const getOrdersStatuses = async (): Promise<OrderStatus[]> => {


  return apiClient<OrderStatus[]>({
    method: 'GET',
    path: `/orders/statuses`,
  });
};



export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<OrderDetails> => {
  console.log('[orders.service] Updating order status:', { orderId, status });

  const response = await apiClient<OrderDetails>({
    method: 'POST',
    path: `/orders/${orderId}`,
    body: { status },
  });

  console.log('[orders.service] Order status updated:', response);
  return response;
};