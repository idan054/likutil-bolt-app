import React from 'react';
import { Package, Truck, CreditCard } from 'lucide-react';
import { translations } from '../../config/translations';
import { formatCurrency } from '../../utils/currency';

interface OrderSummaryProps {
  shippingTotal: string;
  paymentMethod: string;
  total: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  shippingTotal,
  paymentMethod,
  total,
}) => (
  <div className="mt-6 space-y-3">
    <div className="flex items-center gap-2 text-gray-600">
      <Truck size={20} />
      <span>{translations.shipping}: {formatCurrency(shippingTotal)}</span>
    </div>
    <div className="flex items-center gap-2 text-gray-600">
      <CreditCard size={20} />
      <span>{translations.paymentMethod}: {paymentMethod}</span>
    </div>
    <div className="flex items-center gap-2 font-bold text-lg">
      <Package size={20} />
      <span>{translations.total}: {formatCurrency(total)}</span>
    </div>
  </div>
);