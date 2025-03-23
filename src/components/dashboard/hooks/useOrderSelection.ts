import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { OrderDetails, OrderSummary } from '../../../types/order';
import { useOrderSearch } from '../../../hooks/orders/useOrderSearch';
import { useAppState } from '../../../hooks/useAppState';
import { s } from 'framer-motion/client';
import { se } from 'date-fns/locale/se';

export const useOrderSelection = (orders: OrderSummary[], setOrders: React.Dispatch<React.SetStateAction<OrderSummary[]>>) => {
  
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  
  
  const handleSearchOrder = useCallback((searchOrder: OrderSummary) => {
    setOrders(prevOrders => [searchOrder, ...prevOrders]);
    setSelectedOrderId(searchOrder.id.toString());
  }, [orders]);

  const handleOrderSelect = useCallback((orderId: string) => {

    const order = orders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelectedOrderId(orderId);
    } else {
      toast.error('הזמנה לא נמצאה או שאינה בסטטוס "בטיפול"');
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  return {
    handleSearchOrder,
    selectedOrderId,
    handleOrderSelect,
    handleReset
  };
};