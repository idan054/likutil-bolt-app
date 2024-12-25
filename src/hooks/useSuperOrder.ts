import { useState, useCallback } from 'react';
import { aggregateOrderItems } from '../utils/order';
import { useVisitedOrders } from './useVisitedOrders';
import type { OrderSummary } from '../types/order';
import type { SuperOrderItem } from '../types/superOrder';

export const useSuperOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<SuperOrderItem[] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isCompleted } = useVisitedOrders();

  const generateSuperOrder = useCallback(async (orders: OrderSummary[]) => {
    if (!isInitialized) {
      // Dynamically import the required utilities only when needed
      const { default: SuperOrderProcessor } = await import('../utils/superOrder/processor');
      setIsInitialized(true);
    }

    setIsLoading(true);
    try {
      // Filter out completed orders
      const pendingOrders = orders.filter(order => !isCompleted(order.id.toString()));
      const aggregatedItems = aggregateOrderItems(pendingOrders);
      setItems(aggregatedItems);
    } catch (error) {
      console.error('[useSuperOrder] Failed to generate super order:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isCompleted]);

  const clearSuperOrder = useCallback(() => {
    setItems(null);
  }, []);

  return { 
    generateSuperOrder, 
    isLoading,
    items,
    clearSuperOrder,
    isInitialized
  };
};