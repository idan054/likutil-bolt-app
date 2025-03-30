import React, { useEffect } from 'react';
import { Calendar, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { formatShortDate, formatTimeAgo, formatDateWithTimeAgo } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { TruncatedText } from '../ui/TruncatedText';
import { RoleBadge } from '../ui/RoleBadge';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import type { OrderSummary } from '../../types/order';

interface OrderListItemProps {
  order: OrderSummary;
  onSelect: (orderId: string) => void;
  isCompleted: boolean;
  selectedOrderId: string | null;
}

export const OrderListItem: React.FC<OrderListItemProps> = ({ 
  order, 
  onSelect,
  isCompleted,
  selectedOrderId
}) => {
  const { customer, isLoading, refetch } = useCustomerDetails(order.customer_id);

  useEffect(() => {
    if (!customer && !isLoading) {
      refetch();
    }
  }, [customer, isLoading, refetch]);

  return (
    <div 
      onClick={() => onSelect(order.id.toString())}
      className={`rounded-md shadow p-3 hover:shadow-md transition-shadow cursor-pointer relative ${isCompleted ? 'border-l-4 border-green-500' : ''} ${order.id.toString() === selectedOrderId ? 'ring-0 ring-blue-500 bg-[#e6f0ff]' : 'bg-white'}`}
    >

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-blue-900">#{order.id}</span>
            <span className="text-base text-gray-900">{order.billing.first_name} {order.billing.last_name}</span>
          </div>
          {isCompleted && <CheckCircle size={14} className="text-green-500" />}
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock size={12} />
          <span>{formatTimeAgo(order.date_created)}</span>
          {/* <span>{formatTimeAgo(order.date_created)} • {order.status}</span> */}
        </div>
      </div>

      
    </div>
  );
};