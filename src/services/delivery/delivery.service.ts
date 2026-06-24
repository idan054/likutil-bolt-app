import { OrderDetails } from '../../types/order';
import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { DeliveryTaskResponse } from './types';
import { updateOrderMeta } from '../orders/orders.service';

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

/**
 * Persists Mahir Li delivery identifiers onto the WooCommerce order as post-meta,
 * creating a permanent order <-> delivery link for status tracking and customer display.
 *
 * Idempotent: re-running a delivery overwrites the same meta keys (WooCommerce matches
 * meta_data by key). Best-effort: failures are logged but never block the delivery flow.
 * Only acts for the Mahir Li provider on WooCommerce stores.
 */
export const persistMahirliMetaToOrder = async (
  order: OrderDetails,
  response: DeliveryTaskResponse,
  createdAt: string
): Promise<void> => {
  // Whatever Mahir Li returns, log it so the exact shape is verifiable in production.
  console.log('[delivery.service] Mahir Li create response (raw):', response);

  const taskId = response.id != null ? String(response.id) : '';
  const publicId = response.public_id != null ? String(response.public_id) : '';
  const barcode = response.barcode != null ? String(response.barcode) : '';

  const meta: Array<{ key: string; value: string }> = [
    { key: '_s3_mahirli_task_id', value: taskId },
    { key: '_s3_mahirli_public_id', value: publicId },
    { key: '_s3_mahirli_barcode', value: barcode },
    { key: '_s3_mahirli_created_at', value: createdAt },
    { key: '_s3_courier', value: 'mahirli' },
  ];

  try {
    await updateOrderMeta(String(order.id), meta);
  } catch (error) {
    // Do not surface to the user or break the delivery flow - the delivery itself succeeded.
    console.error('[delivery.service] Failed to persist Mahir Li meta to order:', error);
  }
};
