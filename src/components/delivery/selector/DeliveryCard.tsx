import React from 'react';
import { Check } from 'lucide-react';
import type { DeliveryProvider } from '../DeliverySelector';

interface DeliveryCardProps {
  id: DeliveryProvider;
  name: string;
  description: string;
  logoUrl: string;
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  name,
  description,
  logoUrl,
  isSelected,
  isConnected,
  onClick
}) => (
  <div
    onClick={onClick}
    className={`
      relative p-4 rounded-lg border-2 cursor-pointer transition-all
      ${isSelected 
        ? 'border-blue-600 bg-blue-50' 
        : 'border-gray-200 hover:border-blue-300'
      }
    `}
  >
    {isConnected && (
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-100 text-green-600 px-2 py-1 rounded-full">
        <Check size={16} />
        <span className="text-sm font-medium">מחובר</span>
      </div>
    )}

    <div className="flex flex-col items-center text-center">
      <img
        src={logoUrl}
        alt={name}
        className="h-16 w-auto mb-4 object-contain"
      />
      <h3 className="font-semibold text-lg mb-2">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);