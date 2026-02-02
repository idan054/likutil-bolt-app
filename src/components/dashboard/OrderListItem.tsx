import React, { useEffect } from 'react';
import { Calendar, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { formatShortDate, formatTimeAgo, formatDateWithTimeAgo } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { TruncatedText } from '../ui/TruncatedText';
import { RoleBadge } from '../ui/RoleBadge';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import type { OrderSummary } from '../../types/order';
import { StatusBadge } from '../ui/StatusBadge';
import { DeliveryTypeBadge } from '../ui/DeliveryTypeBadge';
import { useOrderFastDeliveryDecision } from '../../hooks/useOrderFastDeliveryDecision';
import { isOtherPaymentMethod } from '../../utils/order';

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
  const { decision } = useOrderFastDeliveryDecision(order);

  useEffect(() => {
    if (!customer && !isLoading) {
      refetch();
    }
  }, [customer, isLoading, refetch]);

  const isSelected = order.id.toString() === selectedOrderId;
  const isOtherPayment = isOtherPaymentMethod(
    order.payment_method_title,
    order.payment_method
  );

  return (
    <div 
      onClick={() => onSelect(order.id.toString())}
      className={`rounded-md shadow p-3 hover:shadow-md transition-shadow cursor-pointer relative 
        ${isCompleted ? 'border-r-4 border-green-500/80' : ''} 
        ${isSelected ? 'ring-0 ring-blue-500 bg-[#e6f0ff]' : 'bg-white'} 
        ${isOtherPayment && !isSelected ? 'bg-amber-50 border border-amber-200' : ''}`}
    >

      <div className="flex flex-col gap-1">
      <div className="absolute top-2 left-2">
      
      {/* USE FOR DEBUG!!!! */}
        {/* <StatusBadge status={`${order.status}`} orderId={order.order_number.toString()} /> */}

      </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-blue-900">#{order.order_number ?? order.id}</span>
            <span className="text-base text-gray-900">{order.billing.first_name} {order.billing.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <DeliveryTypeBadge 
              shippingMethodTitle={order.shipping_lines?.[0]?.method_title} 
              shippingMethodId={order.shipping_lines?.[0]?.method_id}
              shippingInstanceId={(order.shipping_lines?.[0] as any)?.instance_id}
              shippingCost={order.shipping_lines?.[0]?.total}
              deliveryType={decision?.deliveryType} 
              decisionState={decision?.decisionState} 
              checks={decision?.checks} 
            />
          {isCompleted && <CheckCircle size={14} className="text-green-500" />}
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock size={12} />
          <span>{formatTimeAgo(order.date_created)}</span>
        </div>
      </div>
    </div>
  );
};