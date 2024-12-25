import { useState, useEffect } from 'react';
import { getCustomerById } from '../services/customers/customers.service';
import type { CustomerDetails } from '../types/customer';

export const useCustomerDetails = (customerId: number | null) => {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;

      setIsLoading(true);
      try {
        const data = await getCustomerById(customerId);
        setCustomer(data);
      } catch (error) {
        console.error('[useCustomerDetails] Failed to fetch customer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  return { customer, isLoading };
};