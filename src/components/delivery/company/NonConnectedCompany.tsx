import { motion } from 'framer-motion';
import { CompanyLogo } from './CompanyLogo';
import { CompanyHeader } from './CompanyHeader';
import React, { useState } from 'react';
import type { DeliveryIntegration } from '../../../types/delivery';
import { ConfigForm } from './config/ConfigForm';
import { SignupForm } from './signup/SignupForm';

interface NonConnectedCompanyProps {
  integration: DeliveryIntegration;
  initialShowConfig?: boolean;
}


export const NonConnectedCompany: React.FC<NonConnectedCompanyProps> = ({
  integration,
  initialShowConfig = false,
}) => {
  const [showConfig, setShowConfig] = useState(initialShowConfig);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <CompanyLogo src={integration.logoUrl} name={integration.name} />
        
        <div className="flex-1 space-y-4">
          
          {/* <CompanyHeader
            name={integration.name}
            description={integration.description}
          /> */}
          
           <div className="space-y-4">
            
      {showConfig ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">
            התחברות {integration.name}
          </h3>
          <ConfigForm 
            integration={integration}
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

<h3 className="text-xl font-semibold mb-2">הצטרף אל {integration.name}</h3>
<p className="text-gray-600">{integration.description}</p>
          
          <div>



  </div>

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
        </div>
      </div>
    </motion.div>
  );
};