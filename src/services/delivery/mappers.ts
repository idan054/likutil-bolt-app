import type { OrderDetails } from '../../types/order';
import { createDeliveryFormatDate } from '../../utils/date';
import type { DeliveryTaskRequest } from './types';

export const mapOrderToDeliveryTask = (
  order: OrderDetails,
  packNum: string = "1", // Default to 1 package
  deliveryType: string = "client" 
): DeliveryTaskRequest => ({
  pack_num: packNum,
  delivery_type: deliveryType,
  id: order.id.toString(),
  number: order.id.toString(),
  date_created: createDeliveryFormatDate(order.date_created),
  customer_note: order.customer_note || "",
  shipping: {
    first_name: order.shipping.first_name,
    last_name: order.shipping.last_name,
    address_1: order.shipping.address_1,
    address_2: order.shipping.address_2 || "",
    city: order.shipping.city,
  },
  billing: {
    email: order.billing.email || "",
    phone: order.billing.phone || "",
  },
  business: {
    address: order.shipping.address_1, // Use shipping address as business address
    city: order.shipping.city,
    name: `${order.shipping.first_name} ${order.shipping.last_name}`,
  },
});