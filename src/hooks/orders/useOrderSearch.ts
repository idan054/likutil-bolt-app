import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ApiError } from '../../services/api/types';
import type { OrderDetails } from '../../types/order';
import { searchOrderById } from '../../services/orders/orders.service';
import { useGetFirebaseMetadata } from '../useGetFirebaseMetadata';
import { useAppState } from '../useAppState';

export const useOrderSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const { options } = useGetFirebaseMetadata();


  const searchOrder = async (orderId: string) => {
    if (!orderId.trim()) return;

    // Check if settings exist
    const settings = localStorage.getItem('wc_settings');
    if (!settings) {
      toast.error('אנא הגדר את פרטי החיבור לחנות תחילה');
      return;
    }
    
    setIsLoading(true);
    try {

      const metadataConfigs = options.map(config => ({
        label_path: config.original_path?.label_path,
        value_path: config.original_path?.value_path,
        parent_path: config.original_path?.parent_path
      }));
      const result = await searchOrderById(orderId, metadataConfigs);
      
      setOrder(result); 
    

      return result;
    } catch (error) {
      console.error('[orders.search] Failed to find order:', error);
      
      if (error instanceof ApiError) {
        if (error.details.responseStatus === 404) {
          toast.error('הזמנה לא נמצאה');
        } else if (error.details.responseStatus === 401) {
          toast.error('אין הרשאה לצפות בהזמנה זו');
        } else {
          toast.error('שגיאה בחיפוש ההזמנה');
        }
      } else {
        toast.error('שגיאה בחיפוש ההזמנה');
      }
      
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchOrder,
    isLoading,
    order,
    clearOrder: () => setOrder(null)
  };
};