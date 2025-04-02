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
import { OrderDetails } from '../../../types/order';

interface ConnectedCompanyProps {
  order: OrderDetails;
  integration: DeliveryIntegration;
  apiKey?: string;
  isCreating: boolean;
  onCreateDelivery: (packNum: string, deliveryType: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const ConnectedCompany: React.FC<ConnectedCompanyProps> = ({
  order,
  integration,
  apiKey,
  isCreating,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
}) => {
  const [packageCount, setPackageCount] = React.useState<number>(1);
  
  // This would come from your settings or context in a real app
  const businessAddress = {
    address: order.shipping.address_1,
    city: order.shipping.city,
  };
  
  const shippingTitle = order.shipping_lines[0].method_title;
  const isPickupDelivery = shippingTitle.includes('נקודות חלוקה') || shippingTitle.includes('נקודת חלוקה');
  const [deliveryType, setDeliveryType] = React.useState<'client' | 'pickup'>(isPickupDelivery ? 'pickup' : 'client');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-white rounded-lg border border-gray-200 p-4 md:p-6 shadow-sm"
    >
      <div key={order.id} className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
        <CompanyLogo src={integration.logoUrl} name={integration.name} />
        
        <div className="flex-1 space-y-4">
          <CompanyHeader 
            name={integration.name} 
            description={integration.description} 
          />
          
          <PackageCounter 
            isCreating={isCreating}
            onCountChange={setPackageCount}
          />

          <DeliveryAddress 
            address={businessAddress.address}
            city={businessAddress.city}
            deliveryType={deliveryType}
            onDeliveryTypeChange={setDeliveryType}
            programType={integration.programType.toLowerCase() as "baldar" | "ups" | "run" | "lionWheel" | "getPackage" | "unknown"}
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
            onCreateDelivery={() => onCreateDelivery(packageCount.toString(), deliveryType.toString())}
            onComplete={onComplete}
            packNum={packageCount.toString()} 
            deliveryType={deliveryType.toString()} 
          />
          
          <CompanyLinks 
            controlPanelLink={integration.controlPanelLink}
            // supportPhone={integration.fields[0]?.supportPhone}
          />
        </div>
      </div>
    </motion.div>
  );
};