import React from 'react';
import { MapPin, Home, Store } from 'lucide-react';

interface DeliveryAddressProps {
  address: string;
  city: string;
  deliveryType: 'client' | 'pickup';
  onDeliveryTypeChange: (type: 'client' | 'pickup') => void;
  programType?: 'baldar' | 'ups' | 'run' | 'lionWheel' | 'getPackage' | 'unknown';
}

export const DeliveryAddress: React.FC<DeliveryAddressProps> = ({ address, city, deliveryType, onDeliveryTypeChange, programType }) => (
  <div className="space-y-6">
    {programType !== 'ups' ? (
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-200">
        <div className="bg-blue-100 p-2 rounded-full">
          <MapPin className="text-blue-600" size={20} />
        </div>
        <div className="flex-1">
          <div className="font-medium">{address}</div>
          <div className="text-sm text-gray-600">{city}</div>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-4">
        <label 
          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
            deliveryType === 'client' 
              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
          }`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="client"
            checked={deliveryType === 'client'}
            onChange={() => onDeliveryTypeChange('client')}
            className="sr-only"
          />
          <div className={`p-2 rounded-full ${deliveryType === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            <MapPin size={20} />
          </div>
          <div>
            <div className="font-medium">לכתובת הלקוח</div>
            <div className="text-sm text-gray-600">{city}, {address}</div>
          </div>
        </label>

        <label 
          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all duration-200 ${
            deliveryType === 'pickup' 
              ? 'bg-blue-50 border-2 border-blue-500 shadow-sm' 
              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
          }`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="pickup"
            checked={deliveryType === 'pickup'}
            onChange={() => onDeliveryTypeChange('pickup')}
            className="sr-only"
          />
          <div className={`p-2 rounded-full ${deliveryType === 'pickup' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            <Store size={20} />
          </div>
          <div>
            <div className="font-medium">לנקודת חלוקה</div>
            <div className="text-sm text-gray-600">הקרובה ביותר ללקוח</div>
          </div>
        </label>
      </div>
    )}
  </div>
);