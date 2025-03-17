import React from 'react';
import { Settings } from 'lucide-react';
import type { DeliveryProvider } from '../DeliverySelector';

interface CompactDeliveryCardProps {
  id: DeliveryProvider;
  name: string;
  logoUrl: string;
  isSelected: boolean;
  isConnected: boolean;
  onClick: () => void;
}

export const CompactDeliveryCard: React.FC<CompactDeliveryCardProps> = ({
  name,
  logoUrl,
  isSelected,
  isConnected,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`
      relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 min-w-[120px] max-w-[120px]
      ${isSelected 
        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-lg' 
        : isConnected
          ? 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
          : 'border-dashed border-gray-300 hover:border-blue-300 hover:shadow-md bg-gradient-to-br from-gray-50 to-white'
      }
    `}
  >
    {!isConnected && (
      <div className="absolute top-1 right-1 text-gray-400 hover:text-blue-600 transition-colors duration-200">
        <Settings size={14} />
      </div>
    )}

    <div className="relative p-2 rounded-lg bg-white/80 shadow-sm hover:shadow transition-all duration-300 mb-2">
      <img
        src={logoUrl}
        alt={name}
        className="h-10 w-auto object-contain"
      />
    </div>
    <h3 className="text-sm font-medium text-center truncate w-full text-gray-800">
      {name}
    </h3>
    
    {!isConnected ? (
      <span className="text-xs text-gray-500 mt-1 hover:text-blue-600 transition-colors duration-200">לחץ להגדרה</span>
    ) : !isSelected ? (
      <span className="text-xs text-gray-500 mt-1 hover:text-blue-600 transition-colors duration-200">לחץ לבחירה</span>
    ) : (
      <span className="text-xs text-blue-600 mt-1 font-medium">נבחר</span>
    )}
  </div>
);