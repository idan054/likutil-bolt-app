import { apiClient } from '../api/client';
import type { OrderDetails } from '../../types/order';

export const searchOrderById = async (orderId: string): Promise<OrderDetails> => {
  // Validate settings before making the request
  const settings = localStorage.getItem('wc_settings');
  if (!settings) {
    throw new Error('WooCommerce settings not found');
  }

  try {
    return await apiClient<OrderDetails>({
      method: 'GET',
      path: `/orders/${orderId}`,
    });
  } catch (error) {
    console.error('[orders.search.service] Search failed:', error);
    throw error;
  }
};