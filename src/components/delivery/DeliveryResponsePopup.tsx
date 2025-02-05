import React from 'react';
import { DeliveryDetails } from './popup/DeliveryDetails';
import { DeliveryActions } from './popup/DeliveryActions';
import { getDeliveryProviderTitle } from '../../utils/delivery';
import type { DeliveryTaskResponse } from '../../services/delivery/types';
import type { DeliveryProvider } from './DeliverySelector';

interface DeliveryResponsePopupProps {
  response: DeliveryTaskResponse;
  provider: DeliveryProvider;
  onClose: () => void;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const DeliveryResponsePopup: React.FC<DeliveryResponsePopupProps> = ({
  response,
  provider,
  onClose,
  onComplete,
  isCompleting,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            משלוח נפתח בהצלחה ב{getDeliveryProviderTitle(provider)}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <DeliveryDetails response={response} provider={provider} />
          <DeliveryActions 
            response={response}
            provider={provider}
            onComplete={onComplete}
            isCompleting={isCompleting}
          />
        </div>
      </div>
    </div>
  );
};