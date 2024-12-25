import React from 'react';
import { motion } from 'framer-motion';
import { CompanyLogo } from './CompanyLogo';
import { CompanyHeader } from './CompanyHeader';
import { PackageCounter } from './PackageCounter';
import { ConnectionStatus } from './ConnectionStatus';
import { ActionButtons } from './ActionButtons';
import { CompanyLinks } from './CompanyLinks';
import { DeliveryAddress } from './address/DeliveryAddress';
import type { DeliveryIntegration } from '../../../types/delivery';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';

interface ConnectedCompanyProps {
  integration: DeliveryIntegration;
  apiKey?: string;
  isCreating: boolean;
  onCreateDelivery: (packNum: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const ConnectedCompany: React.FC<ConnectedCompanyProps> = ({
  integration,
  apiKey,
  isCreating,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
}) => {
  // This would come from your settings or context in a real app
  const businessAddress = {
    address: "ויצמן 90",
    city: "תל אביב"
  };

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
          
          <PackageCounter 
            isCreating={isCreating}
            onCountChange={count => onCreateDelivery(count.toString())}
          />

          <DeliveryAddress 
            address={businessAddress.address}
            city={businessAddress.city}
          />
          
          <ConnectionStatus 
            apiKey={apiKey}
            isCreating={isCreating}
            deliveryResponse={deliveryResponse}
          />
          
          <ActionButtons 
            deliveryResponse={deliveryResponse}
            isCreating={isCreating}
            isCompleting={isCompleting}
            onCreateDelivery={onCreateDelivery}
            onComplete={onComplete}
          />
          
          <CompanyLinks 
            controlPanelLink={integration.controlPanelLink}
            supportPhone={integration.fields[0]?.supportPhone}
          />
        </div>
      </div>
    </motion.div>
  );
};