import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { DeliveryTaskResponse } from './types';

interface CreateDeliveryParams {
  // order: OrderDetails;
  order: any;
  provider: string;
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