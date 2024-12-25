import type { OrderDetails } from '../../types/order';
import type { DeliveryTaskRequest } from './types';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

export const mapOrderToDeliveryTask = (
  order: OrderDetails,
  packNum: string = "1" // Default to 1 package
): DeliveryTaskRequest => ({
  pack_num: packNum,
  id: order.id.toString(),
  number: order.id.toString(),
  date_created: formatDate(order.date_created),
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