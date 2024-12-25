import React from 'react';
import { motion } from 'framer-motion';
import { CompanyLogo } from './CompanyLogo';
import { CompanyHeader } from './CompanyHeader';
import { SignupContainer } from './signup/SignupContainer';
import type { DeliveryIntegration } from '../../../types/delivery';

interface NonConnectedCompanyProps {
  integration: DeliveryIntegration;
}

export const NonConnectedCompany: React.FC<NonConnectedCompanyProps> = ({
  integration,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <CompanyLogo src={integration.logoUrl} name={integration.name} />
        
        <div className="flex-1 space-y-4">
          <CompanyHeader
            name={integration.name}
            description={integration.description}
          />
          
          <SignupContainer integration={integration} />
        </div>
      </div>
    </motion.div>
  );
};