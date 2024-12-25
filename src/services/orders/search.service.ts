import { apiClient } from '../api/client';
import type { OrderDetails } from '../../types/order';

export const searchOrderById = async (orderId: string): Promise<OrderDetails> => {
  return apiClient<OrderDetails>({
    method: 'GET',
    path: `/orders/${orderId}`,
  });
};