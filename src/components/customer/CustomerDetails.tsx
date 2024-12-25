import React from 'react';
import { ContactInfo } from './ContactInfo';
import type { OrderDetails } from '../../types/order';

interface CustomerDetailsProps {
  billing: OrderDetails['billing'];
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ billing }) => (
  <div className="text-right">
    <h3 className="text-lg font-semibold mb-3">פרטי לקוח</h3>
    <div className="space-y-2">
      <p className="font-medium">
        {billing.first_name} {billing.last_name}
      </p>
      <ContactInfo 
        email={billing.email} 
        phone={billing.phone} 
      />
    </div>
  </div>
);