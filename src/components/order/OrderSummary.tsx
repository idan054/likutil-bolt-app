import React from 'react';
import { Package, Truck, ShoppingBasketIcon, HandCoins } from 'lucide-react';
import { translations } from '../../config/translations';
import { formatCurrency } from '../../utils/currency';
import { PaymentMethodDisplay } from './PaymentMethodDisplay';

interface OrderSummaryProps {
  shippingTotal: string;
  paymentMethod: string;
  total: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  shippingTotal,
  paymentMethod,
  total,
}) => {
  return (
    <div className="mt-6 mx-3">
      <div className="flex justify-between items-center gap-2">
        <PaymentMethodDisplay paymentMethod={paymentMethod} />

      <div className="flex flex-col gap-2">
        
        <div className="flex items-center justify-between gap-2 text-gray-600">
          <Truck size={20} className="transform scale-x-[-1]" />
          {/* <span>{translations.shipping}: {formatCurrency(shippingTotal)}</span> */}
          <span className="text-sm">{formatCurrency(shippingTotal)}</span>
        </div>

        <div className="flex items-center gap-2 font-bold text-xl">
          <ShoppingBasketIcon size={20} />
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
    </div>
  </div>
)};