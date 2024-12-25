import { useState, useEffect, useCallback } from 'react';
import { getProcessingOrders } from '../services/orders/orders.service';
import { showErrorToast } from '../utils/error';
import type { OrderSummary } from '../types/order';

export const useProcessingOrders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    // Don't fetch if settings are not available
    const settingsStr = localStorage.getItem('wc_settings');
    if (!settingsStr) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getProcessingOrders();
      setOrders(data);
    } catch (error) {
      console.error('[useProcessingOrders] Failed to fetch orders:', error);
      showErrorToast(error);
      setError(error instanceof Error ? error : new Error('Failed to fetch orders'));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wc_settings') {
        fetchOrders();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
};