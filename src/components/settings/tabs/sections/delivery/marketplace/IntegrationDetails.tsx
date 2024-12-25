import React from 'react';
import { SignupContainer } from '../../../../../delivery/company/signup/SignupContainer';
import type { DeliveryIntegration } from '../../../../../../types/delivery';

interface IntegrationDetailsProps {
  integration: DeliveryIntegration;
  onClose: () => void;
  savedData?: Record<string, Record<string, string>>;
}

export const IntegrationDetails: React.FC<IntegrationDetailsProps> = ({
  integration,
  onClose,
  savedData = {}
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <SignupContainer 
        integration={integration}
        initialShowConfig={integration.isConnected}
        initialApiKey={savedData[integration.id]?.key}
      />
    </div>
  );
};