import React from 'react';
import type { OrderDetails } from '../../types/order';
import { ContactInfo } from './ContactInfo';

interface ShippingAddressProps {
  shipping: OrderDetails['shipping'];
}

export const ShippingAddress: React.FC<ShippingAddressProps> = ({ shipping }) => 
  (
    <div className="text-right">
      <h3 className="text-lg font-semibold mb-3">פרטי משלוח</h3>
      <div className="space-y-2">
        <p className="font-medium">
          {shipping.address_1}
        </p>


       <p>
         {shipping.city}, {shipping.state} {shipping.postcode} {shipping.country}
       </p>

        <ContactInfo 
          phone={shipping.phone}
        />
      </div>
    </div>
  );
  
