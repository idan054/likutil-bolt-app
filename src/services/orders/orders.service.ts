import { apiClient } from '../api/client';
import type { OrderDetails, OrderSummary } from '../../types/order';

const ITEMS_PER_PAGE = 100;

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  return apiClient<OrderDetails>({
    method: 'GET',
    path: `/orders/${orderId}`,
  });
};

export const getProcessingOrders = async (): Promise<OrderSummary[]> => {
  try {
    let allOrders: OrderSummary[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams({
        status: 'processing',
        per_page: ITEMS_PER_PAGE.toString(),
        orderby: 'date',
        order: 'desc',
        page: page.toString(),
      });

      const orders = await apiClient<OrderSummary[]>({
        method: 'GET',
        path: `/orders?${params.toString()}`,
      });

      if (orders.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orders];
        page++;
      }

      // Break if we've fetched all orders or reached a reasonable limit
      if (orders.length < ITEMS_PER_PAGE || page > 5) {
        hasMore = false;
      }
    }

    console.log(
      '[orders.service] Total processing orders fetched:',
      allOrders.length
    );
    return allOrders;
  } catch (error) {
    console.error('[orders.service] Failed to fetch processing orders:', error);
    throw error;
  }
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
