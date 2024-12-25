import React from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryAddressProps {
  address: string;
  city: string;
}

export const DeliveryAddress: React.FC<DeliveryAddressProps> = ({ address, city }) => (
  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg text-gray-700">
    <div className="bg-blue-100 p-2 rounded-full">
      <MapPin className="text-blue-600" size={20} />
    </div>
    <div className="flex-1">
      <div className="font-medium">{address}</div>
      <div className="text-sm text-gray-600">{city}</div>
    </div>
  </div>
);