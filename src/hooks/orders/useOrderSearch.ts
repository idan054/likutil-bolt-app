import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { searchOrderById } from '../../services/orders/search.service';
import { ApiError } from '../../services/api/types';
import type { OrderDetails } from '../../types/order';

export const useOrderSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  const searchOrder = async (orderId: string) => {
    if (!orderId.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await searchOrderById(orderId);
      setOrder(result);
    } catch (error) {
      console.error('[orders.search] Failed to find order:', error);
      
      if (error instanceof ApiError && error.details.responseStatus === 404) {
        toast.error('הזמנה לא נמצאה');
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