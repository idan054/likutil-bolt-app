import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createDelivery } from '../services/delivery/delivery.service';
import { useDeliveryIntegrations } from './settings/useDeliveryIntegrations';
import { showErrorToast } from '../utils/error';
import { successMessages } from '../config/messages/success';
import type { OrderDetails } from '../types/order';
import type { DeliveryProvider } from '../components/delivery/DeliverySelector';
import type { DeliveryTaskResponse } from '../services/delivery/types';

interface UseDeliveryCreationProps {
  order: OrderDetails;
  provider: DeliveryProvider;
  onSuccess: () => void;
}

export const useDeliveryCreation = ({ 
  order, 
  provider, 
  onSuccess 
}: UseDeliveryCreationProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [deliveryResponse, setDeliveryResponse] = useState<DeliveryTaskResponse | null>(null);
  const { savedData } = useDeliveryIntegrations();

  const createDeliveryTask = async (packNum: string = "1") => {
    const apiKey = savedData[provider]?.key;
    if (!apiKey) {
      toast.error('מפתח API חסר');
      return;
    }

    setIsCreating(true);

    try {
      const result = await createDelivery({
        order,
        provider,
        apiKey,
        packNum
      });

      setDeliveryResponse(result);
      toast.success(successMessages.deliveryCreated);
      onSuccess();
    } catch (error) {
      console.error('[useDeliveryCreation] Failed to create delivery:', error);
      showErrorToast(error);
    } finally {
      setIsCreating(false);
    }
  };

  const clearDeliveryResponse = () => {
    setDeliveryResponse(null);
  };

  return {
    isCreating,
    createDelivery: createDeliveryTask,
    deliveryResponse,
    clearDeliveryResponse,
  };
};