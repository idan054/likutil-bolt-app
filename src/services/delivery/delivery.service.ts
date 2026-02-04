import { OrderDetails } from '../../types/order';
import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { DeliveryTaskResponse } from './types';

interface CreateDeliveryParams {
  userId: string;
  order?: OrderDetails;
  provider: string;
  keys: string;
  packNum?: string;
  deliveryType?: string;
  requestedAt?: string;
}

export const createDelivery = async ({
  userId,
  order,
  provider,
  keys,
  packNum = "1",
  deliveryType = "client",
  requestedAt
}: CreateDeliveryParams): Promise<DeliveryTaskResponse> => {
  console.log('[delivery.service] Creating delivery:', { 
    orderId: order!.id, 
    userId, 
    provider,
    packNum,
    deliveryType
  });

  const request = mapOrderToDeliveryTask(order!, packNum, deliveryType, requestedAt);
  
  return createDeliveryTask(request, {
    userId,
    provider,
    keys: keys
  });
};
