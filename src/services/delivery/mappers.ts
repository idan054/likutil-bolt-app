import type { OrderDetails } from '../../types/order';
import { createDeliveryFormatDate } from '../../utils/date';
import { sanitizeDeliveryContactName } from '../../utils/delivery';
import { formatPhoneForDisplay } from '../../utils/phone';
import type { DeliveryTaskRequest } from './types';

// Fallback value for empty required fields - Lionwheel API rejects empty strings
const EMPTY_FIELD_FALLBACK = "-";

export const mapOrderToDeliveryTask = (
  order: OrderDetails,
  packNum: string = "1", // Default to 1 package
  requestedAt?: string
): DeliveryTaskRequest => {
  const deliveryDate =
    requestedAt || order.date_completed || order.date_modified || order.date_created;
  const shippingAddress =
    order.shipping.address_1?.trim() ||
    order.shipping.address_2?.trim() ||
    order.billing.address_1?.trim() ||
    order.billing.address_2?.trim() ||
    EMPTY_FIELD_FALLBACK;

  const shippingCity =
    order.shipping.city?.trim() || order.billing.city?.trim() || EMPTY_FIELD_FALLBACK;

  const shippingFirstName =
    sanitizeDeliveryContactName(
      order.shipping.first_name?.trim() || order.billing.first_name?.trim() || ''
    ) || EMPTY_FIELD_FALLBACK;
  const shippingLastName =
    sanitizeDeliveryContactName(
      order.shipping.last_name?.trim() || order.billing.last_name?.trim() || ''
    ) || EMPTY_FIELD_FALLBACK;

  const billingAddressCandidate = order.billing.address_1?.trim() || "";
  const businessAddress =
    billingAddressCandidate && billingAddressCandidate !== shippingAddress
      ? billingAddressCandidate
      : "";

  const businessCity = businessAddress
    ? order.billing.city?.trim() || ""
    : "";

  const phone =
    formatPhoneForDisplay(
      order.shipping.phone?.trim() || order.billing.phone?.trim() || ''
    ) || EMPTY_FIELD_FALLBACK;

  return {
    pack_num: packNum,
     // delivery_type: deliveryType, // Removed to fix Mahir Li 500 Error
    id: order.id.toString(),
    number: order.id.toString(),
    date_created: createDeliveryFormatDate(deliveryDate), // Always use date-only format (YYYY-MM-DD) - Lionwheel API rejects datetime
    customer_note: order.customer_note || "",
    shipping: {
      first_name: shippingFirstName,
      last_name: shippingLastName,
      address_1: shippingAddress,
      address_2: order.shipping.address_2 || order.billing.address_2 || "",
      city: shippingCity,
    },
    billing: {
      email: order.billing.email || "",
      phone: phone,
    },
    business: {
      address: businessAddress,
      city: businessCity,
      name: `${shippingFirstName} ${shippingLastName}`.trim() || EMPTY_FIELD_FALLBACK,
    },
  };
};

