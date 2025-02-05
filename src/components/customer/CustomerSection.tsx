import React from 'react';
import { CustomerDetails } from './CustomerDetails';
import { ShippingAddress } from './ShippingAddress';
import type { OrderDetails } from '../../types/order';

interface CustomerSectionProps {
  billing: OrderDetails['billing'];
  onWhatsAppClick?: () => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({ 
  billing,
  onWhatsAppClick
}) => (
  <div className="mt-8 pt-6 border-t">
    <div className="grid md:grid-cols-2 gap-6">
      <CustomerDetails 
        billing={billing} 
        onWhatsAppClick={onWhatsAppClick}
      />
      <ShippingAddress billing={billing} />
    </div>
  </div>
);