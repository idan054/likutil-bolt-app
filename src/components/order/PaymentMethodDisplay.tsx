import React from 'react';
import { HandCoins } from 'lucide-react';

interface PaymentMethodDisplayProps {
  paymentMethod: string;
  showHighlightedPaymentOnly?: boolean;
}

export const PaymentMethodDisplay: React.FC<PaymentMethodDisplayProps> = ({ 
  paymentMethod, 
  showHighlightedPaymentOnly = false 
}) => {
  const isHighlightedPayment = paymentMethod.includes('מזומן') || 
    paymentMethod.includes('תשלום בטלפון') || 
    paymentMethod.includes('העברה') || 
    paymentMethod.includes('בנקאית');

  if (showHighlightedPaymentOnly && !isHighlightedPayment) {
    return null;
  }

  return (
    <div id='payment-method' className={`flex items-center gap-2 ${
      isHighlightedPayment
        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300'
        : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
    } p-3 rounded-lg border-2 transition-all duration-200 ease-in-out hover:shadow-md`}>
      {isHighlightedPayment ? (
        <>
          <HandCoins size={20} className="transform text-yellow-700" />
        </>
      ) : (
        <img
          src="/assets/svg/credit-coin.svg"
          alt="WooCommerce Logo"
          className="h-6 transition-transform group-hover:scale-100"
        />
      )}
      <span className={`font-semibold ${
        isHighlightedPayment 
          ? 'text-black' 
          : 'text-blue-700'
      }`}>{paymentMethod}</span>
    </div>
  );
};