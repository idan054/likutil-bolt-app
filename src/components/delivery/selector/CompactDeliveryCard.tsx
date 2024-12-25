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
      relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all min-w-[120px] max-w-[120px]
      ${isSelected 
        ? 'border-blue-600 bg-blue-50' 
        : isConnected
          ? 'border-gray-200 hover:border-blue-300'
          : 'border-dashed border-gray-300 hover:border-blue-300'
      }
    `}
  >
    {!isConnected && (
      <div className="absolute top-1 right-1 text-gray-400 hover:text-blue-600">
        <Settings size={14} />
      </div>
    )}

    <img
      src={logoUrl}
      alt={name}
      className="h-10 w-auto mb-2 object-contain"
    />
    <h3 className="text-sm font-medium text-center truncate w-full">
      {name}
    </h3>
    
    {!isConnected ? (
      <span className="text-xs text-gray-500 mt-1">לחץ להגדרה</span>
    ) : !isSelected ? (
      <span className="text-xs text-gray-500 mt-1">לחץ לבחירה</span>
    ) : (
      <span className="text-xs text-blue-600 mt-1">נבחר</span>
    )}
  </div>
);