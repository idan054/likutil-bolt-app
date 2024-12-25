import type { OrderSummary } from '../../types/order';
import type { SuperOrderItem } from '../../types/superOrder';

export const aggregateOrderItems = (orders: OrderSummary[]): SuperOrderItem[] => {
  const itemsMap = new Map<string, SuperOrderItem>();

  orders.forEach(order => {
    order.line_items.forEach(item => {
      const key = `${item.product_id}`;
      const existing = itemsMap.get(key);

      if (existing) {
        existing.quantity += item.quantity;
        if (!existing.orderIds.includes(order.id)) {
          existing.orderIds.push(order.id);
        }
      } else {
        // Extract slug from permalink
        const slug = item.permalink?.split('/').filter(Boolean).pop() || '';
        
        itemsMap.set(key, {
          id: key,
          sku: item.sku || '',
          name: item.name,
          quantity: item.quantity,
          image: item.image?.src || '',
          orderIds: [order.id],
          slug: slug,
          productId: item.product_id,
        });
      }
    });
  });

  return Array.from(itemsMap.values()).sort((a, b) => a.sku.localeCompare(b.sku));
};