import React from 'react';
import { Package, Truck, CreditCard, Wallet, Wallet2, Landmark, ShoppingBasket, ShoppingBasketIcon, ShoppingCartIcon, LucideShoppingBag, HandCoins } from 'lucide-react';
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
    <div className={`flex items-center gap-2 ${
      paymentMethod.includes('מזומן') || paymentMethod.includes('העברה') || paymentMethod.includes('בנקאית')
        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
        : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
    } p-3 rounded-lg border-2 transition-all duration-200 ease-in-out hover:shadow-md`}>

        {paymentMethod.includes('מזומן') || paymentMethod.includes('העברה') || paymentMethod.includes('בנקאית') ? (
          <HandCoins size={20} className="transform text-yellow-700" />
        ) : (
          <img
            src="/assets/svg/credit-coin.svg"
            alt="WooCommerce Logo"
            className="h-6 transition-transform group-hover:scale-100"
          />
        )}

        {/* <span>{translations.paymentMethod}: {paymentMethod}</span> */}
        <span className={`font-semibold ${
          paymentMethod.includes('מזומן') || paymentMethod.includes('העברה') || paymentMethod.includes('בנקאית') 
            ? 'text-black' 
            : 'text-blue-700'
        }`}>{paymentMethod}</span>
    </div>



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
);