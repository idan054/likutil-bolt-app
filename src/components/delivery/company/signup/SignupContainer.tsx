import React, { useState } from 'react';
import { SignupForm } from './SignupForm';
import { ConfigForm } from '../config/ConfigForm';
import type { DeliveryIntegration } from '../../../../types/delivery';

interface SignupContainerProps {
  integration: DeliveryIntegration;
  initialShowConfig?: boolean;
  initialApiKey?: string;
}

export const SignupContainer: React.FC<SignupContainerProps> = ({ 
  integration,
  initialShowConfig = false,
  initialApiKey
}) => {
  const [showConfig, setShowConfig] = useState(initialShowConfig);

  return (
    <div className="space-y-4">
      {showConfig ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            הגדרות {integration.name}
          </h3>
          <ConfigForm 
            integration={integration}
            initialApiKey={initialApiKey}
          />
          {!integration.isConnected && (
            <button
              onClick={() => setShowConfig(false)}
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              לחץ להגדרה
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            הצטרף אל {integration.name}
          </h3>
          <SignupForm integration={integration} />
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setShowConfig(true)}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              כבר הצטרפתי
            </button>
            {integration.controlPanelLink && (
              <a
                href={integration.controlPanelLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                פאנל ניהול
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};