import { WOO_COMMERCE } from '../../config/api';
import { ApiError } from './types';
import type { OrderDetails } from '../../types/order';

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  const url = `https://${WOO_COMMERCE.BASE_URL}/wp-json/wc/v3/orders/${orderId}`;
  const auth = btoa(`${WOO_COMMERCE.CONSUMER_KEY}:${WOO_COMMERCE.CONSUMER_SECRET}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError({
        requestUrl: url,
        requestMethod: 'GET',
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        responseStatus: response.status,
        responseStatusText: response.statusText,
        responseBody: data,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      requestUrl: url,
      requestMethod: 'GET',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      responseStatus: 0,
      responseStatusText: 'Network Error',
      responseBody: error instanceof Error ? error.message : 'Failed to fetch order',
    });
  }
};