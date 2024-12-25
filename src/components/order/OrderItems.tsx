import React from 'react';
import { OrderItemCard } from './items/OrderItemCard';
import { translations } from '../../config/translations';
import type { OrderDetails } from '../../types/order';

interface OrderItemsProps {
  items: OrderDetails['line_items'];
}

export const OrderItems: React.FC<OrderItemsProps> = ({ items }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-3">{translations.orderItems}</h3>
    <div className="space-y-4">
      {items.map((item, index) => (
        <OrderItemCard key={index} item={item} />
      ))}
    </div>
  </div>
);