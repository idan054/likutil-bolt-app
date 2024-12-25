import { WOO_COMMERCE } from '../config/api';
import type { OrderDetails } from '../types/order';

export const getOrderById = async (orderId: string): Promise<OrderDetails> => {
  try {
    const response = await fetch(
      `https://${WOO_COMMERCE.BASE_URL}/wp-json/wc/v3/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${WOO_COMMERCE.CONSUMER_KEY}:${WOO_COMMERCE.CONSUMER_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        JSON.stringify({
          url: `https://${WOO_COMMERCE.BASE_URL}/wp-json/wc/v3/orders/${orderId}`,
          method: 'GET',
          requestHeaders: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${WOO_COMMERCE.CONSUMER_KEY}:${WOO_COMMERCE.CONSUMER_SECRET}`)}`,
          },
          responseStatus: response.status,
          responseBody: responseData,
        }, null, 2)
      );
    }

    return responseData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
    throw new Error(errorMessage);
  }
};