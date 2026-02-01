import type { OrderDetails } from '../../types/order';
import { createDeliveryFormatDate } from '../../utils/date';
import type { DeliveryTaskRequest } from './types';

export const mapOrderToDeliveryTask = (
  order: OrderDetails,
  packNum: string = "1", // Default to 1 package
  deliveryType: string = "client" 
): DeliveryTaskRequest => {
  const shippingAddress =
    order.shipping.address_1?.trim() ||
    order.shipping.address_2?.trim() ||
    order.billing.address_1?.trim() ||
    order.billing.address_2?.trim() ||
    "";

  const shippingCity =
    order.shipping.city?.trim() || order.billing.city?.trim() || "";

  const shippingFirstName =
    order.shipping.first_name?.trim() || order.billing.first_name?.trim() || "";
  const shippingLastName =
    order.shipping.last_name?.trim() || order.billing.last_name?.trim() || "";

  const billingAddressCandidate = order.billing.address_1?.trim() || "";
  const businessAddress =
    billingAddressCandidate && billingAddressCandidate !== shippingAddress
      ? billingAddressCandidate
      : "";

  const businessCity = businessAddress
    ? order.billing.city?.trim() || ""
    : "";

  return {
    pack_num: packNum,
    delivery_type: deliveryType,
    id: order.id.toString(),
    number: order.id.toString(),
    date_created: createDeliveryFormatDate(order.date_created),
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
      phone: order.billing.phone || "",
    },
    business: {
      address: businessAddress,
      city: businessCity,
      name: `${shippingFirstName} ${shippingLastName}`.trim(),
    },
  };
};
