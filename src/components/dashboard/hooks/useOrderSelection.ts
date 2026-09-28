import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { OrderSummary } from '../../../types/order';

export const useOrderSelection = (
  orders: OrderSummary[],
  setOrders: React.Dispatch<React.SetStateAction<OrderSummary[]>>,
  scope: string,
) => {
  // An active workflow owns its order snapshot. List refreshes must not discard
  // its shipment response or printing controls when the server status changes.
  const [selection, setSelection] = useState<{ scope: string; order: OrderSummary } | null>(null);
  const selectedOrder = selection?.scope === scope ? selection.order : null;
  const selectedOrderId = selectedOrder?.id.toString() ?? null;

  useEffect(() => {
    setSelection((current) => current?.scope === scope ? current : null);
  }, [scope]);

  const handleSearchOrder = useCallback((searchOrder: OrderSummary) => {
    setOrders((current) => current.some((order) => order.id === searchOrder.id)
      ? current.map((order) => order.id === searchOrder.id ? searchOrder : order)
      : [searchOrder, ...current]);
    setSelection({ scope, order: searchOrder });
  }, [scope, setOrders]);

  const handleOrderSelect = useCallback((orderId: string) => {
    const order = orders.find(o => o.id.toString() === orderId);
    if (order) {
      setSelection({ scope, order });
    } else {
      toast.error('הזמנה לא נמצאה או שאינה בסטטוס "בטיפול"');
    }
  }, [orders, scope]);

  const handleReset = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    handleSearchOrder,
    selectedOrder,
    selectedOrderId,
    handleOrderSelect,
    handleReset
  };
};
