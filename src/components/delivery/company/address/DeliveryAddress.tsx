import React from 'react';
import { MapPin, Store } from 'lucide-react';

interface DeliveryAddressProps {
  address: string;
  city: string;
  deliveryType: 'client' | 'pickup';
  onDeliveryTypeChange: (type: 'client' | 'pickup') => void;
  provider?: string;
}

export const DeliveryAddress: React.FC<DeliveryAddressProps> = ({ address, city, deliveryType, onDeliveryTypeChange }) => (
  <div className="space-y-6">
      <div 
        className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border-2 border-blue-500 shadow-sm"
      >
        <div className="p-2 rounded-full bg-blue-500 text-white">
          <MapPin size={20} />
        </div>
        <div>
          <div className="font-medium">לכתובת הלקוח</div>
          <div className="text-sm text-gray-600">{city}, {address}</div>
        </div>
      </div>
  </div>
);
