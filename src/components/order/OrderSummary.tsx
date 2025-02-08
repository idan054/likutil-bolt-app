import React from 'react';
import { Package, Truck, CreditCard, Wallet, Wallet2, Landmark, ShoppingBasket, ShoppingBasketIcon, ShoppingCartIcon, LucideShoppingBag } from 'lucide-react';
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
  <div className="mt-6 mx-3">
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 text-gray-600">
        <Truck size={20} className="transform scale-x-[-1]" />
        {/* <span>{translations.shipping}: {formatCurrency(shippingTotal)}</span> */}
        <span>{formatCurrency(shippingTotal)}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <CreditCard size={20} />
        {/* <span>{translations.paymentMethod}: {paymentMethod}</span> */}
        <span>{paymentMethod}</span>
      </div>
      <div className="flex items-center gap-2 font-bold text-lg">
        <ShoppingBasketIcon size={20} />
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  </div>
);