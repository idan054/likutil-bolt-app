import type { OrderDetails } from '../../types/order';
import { createDeliveryFormatDate } from '../../utils/date';
import {
  sanitizeDeliveryAddress,
  sanitizeDeliveryCity,
  sanitizeDeliveryContactName,
  sanitizeDeliveryEmail,
  sanitizeDeliveryNote,
} from '../../utils/delivery';
import { formatPhoneForDisplay } from '../../utils/phone';
import type { DeliveryTaskRequest } from './types';

const requireFields = (fields: Array<[string, string]>): void => {
  const missingFields = fields
    .filter(([, value]) => !value)
    .map(([label]) => label);

  if (missingFields.length > 0) {
    throw new Error(`לא ניתן ליצור משלוח: חסרים ${missingFields.join(', ')}`);
  }
};

export const mapOrderToDeliveryTask = (
  order: OrderDetails,
  packNum: string = "1", // Default to 1 package
  requestedAt?: string
): DeliveryTaskRequest => {
  const deliveryDate =
    requestedAt || order.date_completed || order.date_modified || order.date_created;
  const formattedDeliveryDate = createDeliveryFormatDate(deliveryDate);
  const normalizedPackNum = Number.parseInt(packNum, 10);

  if (!/^\d+$/.test(packNum) || normalizedPackNum < 1) {
    throw new Error('לא ניתן ליצור משלוח: מספר החבילות חייב להיות מספר חיובי');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDeliveryDate)) {
    throw new Error('לא ניתן ליצור משלוח: תאריך המשלוח אינו תקין');
  }

  const shippingAddress1 = sanitizeDeliveryAddress(order.shipping.address_1 || '');
  const shippingAddress2 = sanitizeDeliveryAddress(order.shipping.address_2 || '');
  const billingAddress1 = sanitizeDeliveryAddress(order.billing.address_1 || '');
  const billingAddress2 = sanitizeDeliveryAddress(order.billing.address_2 || '');

  let shippingAddress = '';
  let secondaryShippingAddress = '';

  if (shippingAddress1) {
    shippingAddress = shippingAddress1;
    secondaryShippingAddress = shippingAddress2;
  } else if (shippingAddress2) {
    shippingAddress = shippingAddress2;
  } else if (billingAddress1) {
    shippingAddress = billingAddress1;
    secondaryShippingAddress = billingAddress2;
  } else {
    shippingAddress = billingAddress2;
  }

  if (secondaryShippingAddress === shippingAddress) {
    secondaryShippingAddress = '';
  }

  const shippingCity =
    sanitizeDeliveryCity(order.shipping.city || '') ||
    sanitizeDeliveryCity(order.billing.city || '');

  const shippingFirstName =
    sanitizeDeliveryContactName(order.shipping.first_name || '') ||
    sanitizeDeliveryContactName(order.billing.first_name || '');
  const shippingLastName =
    sanitizeDeliveryContactName(order.shipping.last_name || '') ||
    sanitizeDeliveryContactName(order.billing.last_name || '');

  const billingAddressCandidate = billingAddress1 || billingAddress2;
  const businessAddress =
    billingAddressCandidate && billingAddressCandidate !== shippingAddress
      ? billingAddressCandidate
      : "";

  const businessCity = businessAddress
    ? sanitizeDeliveryCity(order.billing.city || '')
    : "";

  const phone =
    formatPhoneForDisplay(
      order.shipping.phone?.trim() || order.billing.phone?.trim() || ''
    );
  const email = sanitizeDeliveryEmail(order.billing.email || '');
  const customerNote = sanitizeDeliveryNote(order.customer_note || '');

  requireFields([
    ['שם פרטי', shippingFirstName],
    ['שם משפחה', shippingLastName],
    ['כתובת', shippingAddress],
    ['עיר', shippingCity],
    ['טלפון', phone],
  ]);

  if (!/^0\d{8,9}$/.test(phone)) {
    throw new Error('לא ניתן ליצור משלוח: מספר הטלפון אינו ישראלי תקין');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('לא ניתן ליצור משלוח: כתובת האימייל אינה תקינה');
  }

  return {
    pack_num: normalizedPackNum.toString(),
     // delivery_type: deliveryType, // Removed to fix Mahir Li 500 Error
    id: order.id.toString(),
    number: order.id.toString(),
    date_created: formattedDeliveryDate,
    customer_note: customerNote,
    shipping: {
      first_name: shippingFirstName,
      last_name: shippingLastName,
      address_1: shippingAddress,
      address_2: secondaryShippingAddress,
      city: shippingCity,
    },
    billing: {
      email,
      phone: phone,
    },
    business: {
      address: businessAddress,
      city: businessCity,
      name: `${shippingFirstName} ${shippingLastName}`.trim(),
    },
  };
};

