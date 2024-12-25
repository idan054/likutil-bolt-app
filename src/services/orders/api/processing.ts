import { makeRequest } from '../../api/client/request';
import { withRetry } from '../../../utils/api/retry';
import { handleApiError } from '../../../utils/api/errors';
import type { OrderSummary } from '../../../types/order';

const ITEMS_PER_PAGE = 100;
const MAX_PAGES = 5;

export const fetchProcessingOrders = async (): Promise<OrderSummary[]> => {
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

      const { data: orders } = await withRetry(
        () => makeRequest<OrderSummary[]>({
          method: 'GET',
          path: `/orders?${params.toString()}`,
        }),
        {
          maxAttempts: 3,
          delayMs: 1000,
        }
      );

      if (!orders || orders.length === 0) {
        hasMore = false;
      } else {
        allOrders = [...allOrders, ...orders];
        page++;
      }

      // Break if we've fetched all orders or reached page limit
      if (orders.length < ITEMS_PER_PAGE || page > MAX_PAGES) {
        hasMore = false;
      }
    }

    return allOrders;
  } catch (error) {
    handleApiError(error, 'orders.processing');
    return [];
  }
};