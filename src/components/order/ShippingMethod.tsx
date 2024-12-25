import React from 'react';
import { Truck } from 'lucide-react';
import { translations } from '../../config/translations';
import type { OrderDetails } from '../../types/order';

interface ShippingMethodProps {
  shippingLines: OrderDetails['shipping_lines'];
}

export const ShippingMethod: React.FC<ShippingMethodProps> = ({ shippingLines }) => {
  const shipping = shippingLines[0];
  if (!shipping) return null;

  return (
    <div className="bg-blue-50 rounded-lg p-6 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <Truck size={24} className="text-blue-600" />
        <h3 className="text-xl font-semibold">{translations.shippingMethod}</h3>
      </div>
      <div className="text-lg text-blue-800">
        {shipping.method_title}
        {shipping.total !== '0' && (
          <span className="text-blue-600 mr-2">
            (₪{shipping.total})
          </span>
        )}
      </div>
    </div>
  );
};