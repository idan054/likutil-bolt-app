import { apiClient } from '../api/client';
import type { CustomerDetails } from '../../types/customer';

export const getCustomerById = async (customerId: number): Promise<CustomerDetails> => {
  return apiClient<CustomerDetails>({
    method: 'GET',
    path: `/customers/${customerId}`,
  });
};