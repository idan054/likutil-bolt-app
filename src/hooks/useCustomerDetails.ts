import { useState, useEffect, useCallback } from 'react';
import { getCustomerById } from '../services/customers/customers.service';
import { showErrorToast } from '../utils/error';
import type { CustomerDetails } from '../types/customer';

// Cache for customer data
const customerCache = new Map<number, CustomerDetails>();

export const useCustomerDetails = (customerId: number | null) => {
  const [customer, setCustomer] = useState<CustomerDetails | null>(() => 
    customerId ? customerCache.get(customerId) || null : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;

    const settings = localStorage.getItem('wc_settings');
    if (!settings) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cachedData = customerCache.get(customerId);
    if (cachedData) {
      setCustomer(cachedData);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getCustomerById(customerId);
      // Update cache
      customerCache.set(customerId, data);
      setCustomer(data);
    } catch (error) {
      console.error('[useCustomerDetails] Failed to fetch customer:', error);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId && !customerCache.has(customerId)) {
      // Only fetch if not in cache
      const timer = setTimeout(fetchCustomer, 500);
      return () => clearTimeout(timer);
    }
  }, [customerId, fetchCustomer]);

  const clearCache = useCallback(() => {
    if (customerId) {
      customerCache.delete(customerId);
      setCustomer(null);
    }
  }, [customerId]);

  return { 
    customer, 
    isLoading,
    refetch: useCallback(async () => {
      clearCache();
      await fetchCustomer();
    }, [clearCache, fetchCustomer]),
    hasError: !isLoading && !customer && customerId !== null
  };
};