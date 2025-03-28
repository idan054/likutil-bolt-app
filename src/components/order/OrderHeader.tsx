import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { LocalPickupMarker } from './LocalPickupMarker';
import { ArrowRight } from 'lucide-react';
import { translations } from '../../config/translations';
import { formatDate, formatDateWithTimeAgo } from '../../utils/date';
import { RoleBadge } from '../ui/RoleBadge';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import { OrderSummary } from './OrderSummary';
import type { OrderDetails as OrderDetailType } from '../../types/order';


interface OrderHeaderProps {
  order: OrderDetailType;
  id: number;
  status: string;
  dateCreated: string;
  isLocalPickup?: boolean;
  customerId: number | null;
  onReset: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ 
  order,
  id, 
  status, 
  dateCreated,
  isLocalPickup,
  customerId,
  onReset
}) => {
  const { customer, isLoading } = useCustomerDetails(order.customer_id);
  const billingDetails = order.billing

  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowRight size={20} />
          <span>חזור להזמנות</span>
        </button>
        <div className="flex items-center gap-2">
          <RoleBadge 
            role={customer?.role} 
            isLoading={isLoading}
          />
          <StatusBadge status={status} orderId={order.id.toString()} />
          {isLocalPickup && <LocalPickupMarker />}
        </div>




      </div>
<h2 className="text-2xl">
  <span className="font-bold">{translations.orderNumber} #{id}</span>
  {billingDetails?.first_name && <span className="font-normal"> {billingDetails.first_name} {billingDetails.last_name}</span>}
</h2>

      <p className="text-gray-600 mt-1">
        {translations.orderedOn} {formatDateWithTimeAgo(dateCreated)}
      </p>
    



      
    </div>
  );
};