import { OrderDetails } from '../../types/order';
import { createDeliveryTask } from './api/delivery';
import { mapOrderToDeliveryTask } from './mappers';
import type { DeliveryTaskResponse } from './types';
import { getOrderById, updateOrderMeta } from '../orders/orders.service';
import { siteCarrierForProvider } from '../../utils/siteCarrier';

interface CreateDeliveryParams {
  userId: string;
  order?: OrderDetails;
  provider: string;
  keys: string;
  packNum?: string;
  deliveryType?: string;
  requestedAt?: string;
  additionalShipmentRevision?: string;
  replacementShipmentRevision?: string;
}

export const createDelivery = async ({
  userId,
  order,
  provider,
  keys,
  packNum = "1",
  deliveryType = "client",
  requestedAt,
  additionalShipmentRevision,
  replacementShipmentRevision
}: CreateDeliveryParams): Promise<DeliveryTaskResponse> => {
  if (!order) {
    throw new Error('לא ניתן ליצור משלוח: לא נבחרה הזמנה');
  }

  // Revalidate approval on the server before any carrier request, even for an old open screen.
  // A failed read stops here; shipment creation is never retried automatically.
  await getOrderById(String(order.id), true);

  console.log('[delivery.service] Creating delivery:', { 
    orderId: order.id,
    provider,
    packNum,
    deliveryType
  });

  const request = mapOrderToDeliveryTask(order, packNum, requestedAt);
  
  return createDeliveryTask(request, {
    userId,
    provider,
    keys: keys,
    additionalShipmentRevision,
    replacementShipmentRevision
  });
};

/**
 * Marks on the WooCommerce order which courier took the parcel, for every provider the site tracks.
 * `_s3_courier` is always written (mahirli | zipgo | negev): the site uses it to choose the account it
 * polls, and after a parcel is moved between couriers it is the only record of who holds it now.
 * ZipGo runs on LionWheel like Mahir Li but under its own account, so its identifiers go under their own
 * keys (`_s3_zipgo_*`); a ZipGo number stored under the Mahir Li keys would be looked up in the wrong account.
 * Best-effort: a failure is logged and never blocks the delivery flow.
 */
export const persistCourierMetaToOrder = async (
  order: OrderDetails,
  provider: string,
  response: DeliveryTaskResponse,
  createdAt: string
): Promise<void> => {
  if (provider === 'mahirLi') {
    await persistMahirliMetaToOrder(order, response, createdAt);
    return;
  }
  const courier = siteCarrierForProvider(provider);
  if (!courier) return;

  const meta: Array<{ key: string; value: string }> = [{ key: '_s3_courier', value: courier }];
  if (courier === 'zipgo') {
    const trackNumber = response.track_number != null ? String(response.track_number) : '';
    let publicId = response.public_id != null ? String(response.public_id) : '';
    if (!publicId && response.print_label) {
      const match = /[?&]public_id=([^&]+)/i.exec(response.print_label);
      if (match) publicId = decodeURIComponent(match[1]);
    }
    meta.push(
      { key: '_s3_zipgo_task_id', value: response.id != null ? String(response.id) : trackNumber },
      { key: '_s3_zipgo_public_id', value: publicId },
      { key: '_s3_zipgo_created_at', value: createdAt }
    );
  }

  try {
    await updateOrderMeta(String(order.id), meta);
  } catch (error) {
    console.error('[delivery.service] Failed to persist courier meta to order:', error);
  }
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
  // The Likutil proxy returns: print_label, control_panel_link, provider, track_number.
  // The numeric tracking/task number arrives as `track_number`, and the Lionwheel
  // public_id is embedded in the print_label URL (?public_id=XXXX).
  const trackNumber = response.track_number != null ? String(response.track_number) : '';

  let publicId = response.public_id != null ? String(response.public_id) : '';
  if (!publicId && response.print_label) {
    const match = /[?&]public_id=([^&]+)/i.exec(response.print_label);
    if (match) publicId = decodeURIComponent(match[1]);
  }

  // Prefer an explicit numeric id if the proxy ever provides one; otherwise the
  // track number is our identifier for tasks/show. Barcode falls back to the track number.
  const taskId = response.id != null ? String(response.id) : trackNumber;
  const barcode = response.barcode != null ? String(response.barcode) : trackNumber;

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
