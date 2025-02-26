import { apiClient } from '../api/client';
import type { OrderDetails, OrderStatus, OrderSummary } from '../../types/order';
import { JSONPath } from 'jsonpath-plus';

const ITEMS_PER_PAGE = 100;

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  return apiClient<OrderDetails>({
    method: 'GET',
    path: `/orders/${orderId}`,
  });
};


export const getProcessingOrders = async (): Promise<OrderSummary[]> => {
  console.log('[orders.service] Fetching processing orders...');

  console.log(new Date().toLocaleString('he-IL', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }))

      const params = new URLSearchParams({
        status: 'processing',
        per_page: ITEMS_PER_PAGE.toString(),
        orderby: 'date',
        order: 'desc',
      });

    

      const buildMetadataEntry = (
        item: any,
        config: { label_path?: string; value_path?: string; parent_path?: string }
      ) => {
        if (!config.parent_path) {
          console.error('Missing parent_path in config.');
          return [];
        }
      
        // Get parent objects using parent_path
        const parents = JSONPath({ path: config.parent_path, json: item });
      
        let newMetadata: { label: any; value: any }[] = [];
      
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
      
        // Filter out duplicates against existing metadata
        const existingMetadata = item.meta_data || [];
        return newMetadata.filter(
          (newEntry) =>
            !existingMetadata.some(
              (existing) => existing.label === newEntry.label && existing.value === newEntry.value
            )
        );
      };
      
      const processMetadata = (
        data: OrderSummary[],
        config?: { label_path?: string; value_path?: string; parent_path?: string }
      ) => {
        if (!config) return data;
      
        let result = data.map((order) => ({
          ...order,
          line_items: order.line_items.map((item) => ({
            ...item,
            meta_data: [...(item.meta_data || []), ...buildMetadataEntry(item, config)]
          }))
        }));
      
        console.log('POST METADATA EMBEDDED:', result);
        return result;
      };
      
      // Example configurations:
      let config = {
        label_path: '$..Label',
        value_path: '$..SelectedValues[*].Value',
        parent_path: '$..Fields[*]'
      };
    
    
    return apiClient<OrderSummary[]>({      method: 'GET',
      path: `/orders/?${params.toString()}`,
    })
    .then(response => processMetadata(response, config)
  );
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