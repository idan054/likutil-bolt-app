import { useState, useEffect, useCallback } from 'react';
import { fetchProcessingOrders } from '../../services/orders/api/processing';
import { useSettingsAvailability } from '../settings/useSettingsAvailability';
import type { OrderSummary } from '../../types/order';

export const useProcessingOrders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { hasSettings } = useSettingsAvailability();

  const fetchOrders = useCallback(async () => {
    if (!hasSettings) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchProcessingOrders();
      setOrders(data);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to fetch orders'));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasSettings]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
};