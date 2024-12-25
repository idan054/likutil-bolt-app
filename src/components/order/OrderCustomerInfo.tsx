import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import type { OrderDetails } from '../../types/order';
import { translations } from '../../config/translations';
import { formatPhoneForWhatsapp } from '../../utils/phone';

interface OrderCustomerInfoProps {
  billing: OrderDetails['billing'];
}

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ billing }) => (
  <div className="grid md:grid-cols-2 gap-6">
    <div>
      <h3 className="text-lg font-semibold mb-3">{translations.customerDetails}</h3>
      <div className="space-y-2">
        <p>
          {billing.first_name} {billing.last_name}
        </p>
        {billing.email && billing.email.trim() && (
          <div className="flex items-center gap-2 justify-end">
            <a 
              href={`mailto:${billing.email}`}
              className="text-gray-700 hover:text-blue-600"
            >
              {billing.email}
            </a>
            <a
              href={`mailto:${billing.email}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
              title={translations.actions.contactEmail}
            >
              <Mail size={20} />
            </a>
          </div>
        )}
        {billing.phone && (
          <div className="flex items-center gap-2 justify-end">
            <a 
              href={`tel:${billing.phone}`}
              className="text-gray-700 hover:text-blue-600"
            >
              {billing.phone}
            </a>
            <a
              href={`https://wa.me/${formatPhoneForWhatsapp(billing.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
              title={translations.actions.contactWhatsapp}
            >
              <MessageCircle size={20} />
            </a>
          </div>
        )}
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-3">{translations.shippingAddress}</h3>
      <div className="space-y-1">
        <p>{billing.address_1}</p>
        <p>
          {billing.city}, {billing.state} {billing.postcode}
        </p>
        <p>{billing.country}</p>
      </div>
    </div>
  </div>
);