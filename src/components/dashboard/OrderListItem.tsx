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
}

export const OrderListItem: React.FC<OrderListItemProps> = ({ 
  order, 
  onSelect,
  isCompleted 
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
        
    
        <div className="text-left flex flex-col gap-2">

          
        <div className="inline-flex flex-row-reverse items-center gap-1 text-sm text-gray-500 ml-2">
            <span>{formatTimeAgo(order.date_created)}</span>
            <Clock size={14} />
          </div>
          


          <div className="text-left text-sm text-gray-500 ml-2 ">
            {formatCurrency(order.total)}
          </div>

          <div className="mt-1">
            <RoleBadge 
              role={customer?.role} 
              isLoading={isLoading}
            />
          </div>

        </div>

      </div>
    </div>
  );
};