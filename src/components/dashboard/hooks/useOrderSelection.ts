import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { OrderSummary } from '../../../types/order';

export const useOrderSelection = (orders: OrderSummary[]) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleOrderSelect = useCallback((orderId: string) => {
    const order = orders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrderId(orderId);
    } else {
      toast.error('הזמנה לא נמצאה או שאינה בסטטוס "בטיפול"');
    }
  }, [orders]);

  const handleReset = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  return {
    selectedOrderId,
    handleOrderSelect,
    handleReset
  };
};