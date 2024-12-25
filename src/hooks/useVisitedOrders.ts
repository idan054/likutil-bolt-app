import { useState } from 'react';

export const useVisitedOrders = () => {
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());

  const markAsCompleted = (orderId: string) => {
    setCompletedOrders(prev => new Set([...prev, orderId]));
  };

  const isCompleted = (orderId: string) => {
    return completedOrders.has(orderId);
  };

  return {
    markAsCompleted,
    isCompleted
  };
};