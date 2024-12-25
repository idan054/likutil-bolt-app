import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { LocalPickupMarker } from './LocalPickupMarker';
import { ArrowRight } from 'lucide-react';
import { translations } from '../../config/translations';
import { formatDate } from '../../utils/date';
import { RoleBadge } from '../ui/RoleBadge';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';

interface OrderHeaderProps {
  id: number;
  status: string;
  dateCreated: string;
  isLocalPickup?: boolean;
  customerId: number | null;
  onReset: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({ 
  id, 
  status, 
  dateCreated,
  isLocalPickup,
  customerId,
  onReset
}) => {
  const { customer, isLoading } = useCustomerDetails(customerId);

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
          <StatusBadge status={status} />
          {isLocalPickup && <LocalPickupMarker />}
        </div>
      </div>
      <h2 className="text-2xl font-bold">{translations.orderNumber} #{id}</h2>
      <p className="text-gray-600 mt-1">
        {translations.orderedOn} {formatDate(dateCreated)}
      </p>
    </div>
  );
};