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
      relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1
      ${isSelected 
        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-lg' 
        : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
      }
    `}
  >
    {isConnected && (
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-green-100/80 backdrop-blur-sm text-green-600 px-3 py-1.5 rounded-full shadow-sm">
        <Check size={16} />
        <span className="text-sm font-medium">מחובר</span>
      </div>
    )}

    <div className="flex flex-col items-center text-center">
      <div className="relative mb-5 p-2 rounded-lg bg-white/80 shadow-sm hover:shadow transition-all duration-300">
        <img
          src={logoUrl}
          alt={name}
          className="h-16 w-auto object-contain"
        />
      </div>
      <h3 className="font-semibold text-lg mb-3 text-gray-800">{name}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);