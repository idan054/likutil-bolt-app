import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { LocalPickupMarker } from './LocalPickupMarker';
import { ArrowRight, Zap } from 'lucide-react';
import { translations } from '../../config/translations';
import { formatDate, formatDateWithTimeAgo } from '../../utils/date';
import { RoleBadge } from '../ui/RoleBadge';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import { OrderSummary } from './OrderSummary';
import type { OrderDetails as OrderDetailType } from '../../types/order';


interface OrderHeaderProps {
  order: OrderDetailType;
  id: number;
  order_number: number;
  status: string;
  dateCreated: string;
  isLocalPickup?: boolean;
  /** The customer paid regular shipping and the order goes out same-day for free. */
  shippingUpgraded?: boolean;
  customerId: number | null;
  onReset: () => void;
  beforeStatusChange?: (newStatus: string) => boolean;
  onStatusUpdate?: (newStatus: string) => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ 
  order,
  id, 
  order_number, 
  status, 
  dateCreated,
  isLocalPickup,
  shippingUpgraded,
  customerId,
  onReset,
  beforeStatusChange,
  onStatusUpdate,
}) => {
  const { customer, isLoading } = useCustomerDetails(order.customer_id);
  const billingDetails = order.billing

  return (
    <div className="border-b pb-4 mb-4">
      <div className="flex justify-between items-center mb-2">

        <div  className="md:hidden">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowRight size={20}/>
          <span>חזור להזמנות</span>
        </button>
        </div>
 
        <h2 className="text-2xl hidden md:block">
          <span className="font-bold">{translations.orderNumber} #{order_number ?? id}</span>
          {billingDetails?.first_name && <span className="font-normal"> {billingDetails.first_name} {billingDetails.last_name}</span>}
        </h2>


        <div className="flex items-center gap-2">
          <div className="flex flex-col items-stretch gap-1">
            <RoleBadge 
              role={customer?.role} 
              isVipMember={order.is_vip_member ?? customer?.is_vip_member}
              isLoading={isLoading}
            />
            {shippingUpgraded && (
              <span
                className="relative px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-1 whitespace-nowrap animate-pulse"
                title="הלקוח שילם משלוח רגיל ויוצא מהיום להיום בלי תשלום"
              >
                <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400 animate-ping" aria-hidden="true" />
                <Zap size={12} />
                <span>שודרג למהיר</span>
              </span>
            )}
          </div>
          <StatusBadge status={status} orderId={order.id.toString()} beforeStatusChange={beforeStatusChange} onStatusUpdate={onStatusUpdate} />
          {isLocalPickup && <LocalPickupMarker />}
        </div>




      </div>

      <h2 className="text-2xl md:hidden">
  <span className="font-bold">{translations.orderNumber} #{id}</span>
   {billingDetails?.first_name && <span className="font-normal"> {billingDetails.first_name} {billingDetails.last_name}</span>}
</h2>


      <p className="text-gray-500 -mt-1">
        {translations.orderedOn} {formatDateWithTimeAgo(dateCreated)}
      </p>
      
    </div>
  );
};
