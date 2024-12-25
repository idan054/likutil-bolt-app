import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { updateOrderStatus } from '../services/orders/orders.service';
import { showErrorToast } from '../utils/error';
import { successMessages } from '../config/messages/success';

interface UseOrderCompletionProps {
  orderId: number;
  onSuccess: () => void;
}

export const useOrderCompletion = ({ orderId, onSuccess }: UseOrderCompletionProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const completeOrder = async () => {
    console.log('[useOrderCompletion] Starting order completion:', { orderId });
    setIsCompleting(true);

    try {
      const updatedOrder = await updateOrderStatus(orderId.toString(), 'completed');
      console.log('[useOrderCompletion] Order completed successfully:', updatedOrder);
      
      toast.success(successMessages.orderCompleted);
      // toast.success(successMessages.smsNotification);
      onSuccess();
    } catch (error) {
      console.error('[useOrderCompletion] Failed to complete order:', error);
      showErrorToast(error);
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    isCompleting,
    completeOrder,
  };
};