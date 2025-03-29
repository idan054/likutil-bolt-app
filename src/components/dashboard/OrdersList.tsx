import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderListItem } from './OrderListItem';
import type { OrderSummary } from '../../types/order';

interface OrdersListProps {
  orders: OrderSummary[];
  onSelectOrder: (orderId: string) => void;
  isCompleted: (orderId: string) => boolean;
  selectedOrderId: string | null;
}

export const OrdersList: React.FC<OrdersListProps> = ({ 
  orders, 
  onSelectOrder,
  isCompleted,
  selectedOrderId
}) => (
  <div className="divide-y divide-gray-200">
    <AnimatePresence>
      {orders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.3,
            delay: index * 0.1,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <OrderListItem 
            order={order} 
            onSelect={onSelectOrder}
            isCompleted={isCompleted(order.id.toString())}
            selectedOrderId={selectedOrderId}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);