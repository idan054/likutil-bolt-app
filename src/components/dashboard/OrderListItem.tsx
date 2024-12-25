import React from 'react';
import { Calendar, Package, Truck, CheckCircle } from 'lucide-react';
import { formatShortDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { TruncatedText } from '../ui/TruncatedText';
import type { OrderSummary } from '../../types/order';

interface OrderListItemProps {
  order: OrderSummary;
  onSelect: (orderId: string) => void;
  isCompleted: boolean;
}

export const OrderListItem: React.FC<OrderListItemProps> = ({ 
  order, 
  onSelect,
  isCompleted 
}) => (
  <div 
    onClick={() => onSelect(order.id.toString())}
    className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer relative ${
      isCompleted ? 'border-l-4 border-green-500' : ''
    }`}
  >
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Package className="text-blue-600" size={24} />
          <span className="text-xl font-bold text-blue-900">#{order.id}</span>
          {isCompleted && (
            <CheckCircle size={16} className="text-green-500" />
          )}
        </div>
        <div className="space-y-2 text-right">
          <h3 className="text-lg font-bold text-gray-900">
            {order.billing.first_name} {order.billing.last_name}
          </h3>
          <div className="flex items-center gap-2 text-gray-600">
            <Truck size={16} className="text-blue-500" />
            <TruncatedText text={order.shipping_lines[0]?.method_title || 'משלוח רגיל'} maxLength={60} />
          </div>
          <p className="text-gray-600 text-base">{order.billing.city}</p>
        </div>
      </div>
      
      <div className="text-left">
        <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
          <Calendar size={14} />
          <span>{formatShortDate(order.date_created)}</span>
        </div>
        <span className="text-sm text-gray-500">{formatCurrency(order.total)}</span>
      </div>
    </div>
  </div>
);