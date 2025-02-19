import { apiClient } from '../api/client';
import type { OrderDetails, OrderStatus, OrderSummary } from '../../types/order';

const ITEMS_PER_PAGE = 100;

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  return apiClient<OrderDetails>({
    method: 'GET',
    path: `/orders/${orderId}`,
  });
};


export const getProcessingOrders = async (): Promise<OrderSummary[]> => {

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

    

  return apiClient<OrderSummary[]>({
    method: 'GET',
    path: `/orders/?${params.toString()}`,
  });
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