import React from 'react';
import type { OrderDetails } from '../../types/order';

interface ShippingAddressProps {
  billing: OrderDetails['billing'];
}

export const ShippingAddress: React.FC<ShippingAddressProps> = ({ billing }) => (
  <div>
    <h3 className="text-lg font-semibold mb-3 text-right">כתובת למשלוח</h3>
    <div className="space-y-1 text-right">
      <p>{billing.address_1}</p>
      <p>
        {billing.city}, {billing.state} {billing.postcode}
      </p>
      <p>{billing.country}</p>
    </div>
  </div>
);