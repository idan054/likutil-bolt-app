import { OrderDetails } from '../../types/order';
import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { DeliveryTaskResponse } from './types';

interface CreateDeliveryParams {
  userId: string;
  order: OrderDetails;
  provider: string;
  keys: string;
  packNum?: string;
}

export const createDelivery = async ({
  userId,
  order,
  provider,
  keys,
  packNum = "1"
}: CreateDeliveryParams): Promise<DeliveryTaskResponse> => {
  console.log('[delivery.service] Creating delivery:', { 
    orderId: order.id, 
    userId, 
    provider,
    packNum
  });

  const request = mapOrderToDeliveryTask(order, packNum);
  
  return createDeliveryTask(request, {
    userId,
    provider,
    keys: keys
  });
};