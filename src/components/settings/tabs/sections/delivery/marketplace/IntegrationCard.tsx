import React from 'react';
import { Check } from 'lucide-react';
import type { DeliveryIntegration } from '../../../../../../types/delivery';

interface IntegrationCardProps {
  integration: DeliveryIntegration;
  isActive: boolean;
  onClick: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  isActive,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
        }
      `}
    >
      {integration.isConnected && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-100 text-green-600 px-2 py-1 rounded-full">
          <Check size={16} />
          <span className="text-sm font-medium">מחובר</span>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <img
          src={integration.logoUrl}
          alt={integration.name}
          className="h-16 w-auto mb-4 object-contain"
        />
        <h3 className="font-semibold text-lg mb-2">{integration.name}</h3>
        <p className="text-sm text-gray-600">{integration.description}</p>
      </div>
    </div>
  );
};