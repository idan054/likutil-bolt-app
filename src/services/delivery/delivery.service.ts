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
}

export const createDelivery = async ({
  userId,
  order,
  provider,
  keys,
  packNum = "1",
  deliveryType = "client"
}: CreateDeliveryParams): Promise<DeliveryTaskResponse> => {
  console.log('[delivery.service] Creating delivery:', { 
    orderId: order!.id, 
    userId, 
    provider,
    packNum,
    deliveryType
  });

  const request = mapOrderToDeliveryTask(order!, packNum, deliveryType);
  
  return createDeliveryTask(request, {
    userId,
    provider,
    keys: keys
  });
};