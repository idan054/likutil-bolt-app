import React from 'react';
import { Settings } from 'lucide-react';
import type { DeliveryProvider } from '../DeliverySelector';

interface CompactDeliveryCardProps {
  id: DeliveryProvider;
  name: string;
  logoUrl: string;
  isSelected: boolean;
  isConnected: boolean;
  disabled?: boolean;
  /** The courier cannot take this order (for example it does not reach the town): grey card, not clickable. */
  blockedReason?: string;
  onClick: () => void;
}

export const CompactDeliveryCard: React.FC<CompactDeliveryCardProps> = ({
  name,
  logoUrl,
  isSelected,
  isConnected,
  disabled,
  blockedReason,
  onClick,
}) => blockedReason ? (
  <div
    role="group"
    aria-label={`${name}: ${blockedReason}`}
    aria-disabled="true"
    title={blockedReason}
    className="relative flex flex-col items-center p-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed min-w-[120px] max-w-[120px]"
  >
    <div className="relative p-2 rounded-lg bg-white/80 mb-2">
      <img src={logoUrl} alt={name} className="h-10 w-auto object-contain grayscale" />
    </div>
    <h3 className="text-sm font-medium text-center truncate w-full text-gray-600">{name}</h3>
    <span className="text-xs text-red-700 mt-1 text-center leading-tight">{blockedReason}</span>
  </div>
) : (
  <button
    type="button"
    aria-label={`משלוחים ב${name}`}
    aria-pressed={isSelected}
    disabled={disabled}
    onClick={onClick}
    className={`
      relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-wait min-w-[120px] max-w-[120px]
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
  </button>
);
