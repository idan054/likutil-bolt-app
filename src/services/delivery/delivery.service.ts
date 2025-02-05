import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { OrderDetails } from '../../types/order';
import type { DeliveryProvider } from '../../components/delivery/DeliverySelector';
import type { DeliveryTaskResponse } from './types';

interface CreateDeliveryParams {
  order: OrderDetails;
  provider: DeliveryProvider;
  apiKey: string;
  packNum?: string;
}

export const createDelivery = async ({
  order,
  provider,
  apiKey,
  packNum = "1"
}: CreateDeliveryParams): Promise<DeliveryTaskResponse> => {
  console.log('[delivery.service] Creating delivery:', { 
    orderId: order.id, 
    provider,
    packNum
  });

  const request = mapOrderToDeliveryTask(order, packNum);
  
  return createDeliveryTask(request, {
    provider,
    key: apiKey
  });
};