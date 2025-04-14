import { motion } from 'framer-motion';
import { CompanyLogo } from './CompanyLogo';
import { CompanyHeader } from './CompanyHeader';
import React, { useEffect, useState } from 'react';
import type { DeliveryIntegration } from '../../../types/delivery';
import { ConfigForm } from './config/ConfigForm';
import { SignupForm } from './signup/SignupForm';
import { DeliveryProgramType } from '../../settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard';
import { Check } from 'lucide-react';

interface NonConnectedCompanyProps {
  integration: DeliveryIntegration;
  initialShowConfig?: boolean;
}


export const NonConnectedCompany: React.FC<NonConnectedCompanyProps> = ({
  integration,
  initialShowConfig = true,
}) => {
  const [showConfig, setShowConfig] = useState(initialShowConfig);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
  
    
      {integration.isConnected && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-100 text-green-600 px-2 py-1 rounded-full">
            <Check size={16} />
            <span className="text-sm font-medium">מחובר</span>
          </div>
        )}

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
          {/* {!integration.isConnected && (
            <button
              onClick={() => setShowConfig(false)}
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              לחץ לחזור
            </button>
          )} */}
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
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2"
              >
            
                פאנל ניהול
                    {process.env.NODE_ENV === 'development' && (
                      <img 
                        src={integration.programType === DeliveryProgramType.BALDAR 
                          ? 'https://i.ibb.co/9mc3JMj8/99-23112021171134.png' 
                          : integration.programType === DeliveryProgramType.RUN
                            ? 'https://i.ibb.co/r25Dw4Qn/164-03062021161548.jpg' 
                            : integration.programType === DeliveryProgramType.LION_WHEEL
                              ? 'https://i.ibb.co/LXGFrQbn/lionwheel.jpg'
                              : integration.programType === DeliveryProgramType.GET_PACKAGE
                                ? 'GET_PACKAGE.png'
                                : ''}
                        alt="Control Panel Icon"
                        className="h-8"
                      />
                    )}
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