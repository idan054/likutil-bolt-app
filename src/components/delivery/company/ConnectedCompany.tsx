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
import { maxPackagesPerShipment, packageLimitHint } from '../../../utils/packageLimit';
import { DeliveryProgramType } from '../../settings/tabs/sections/delivery/marketplace/AddDeliveryCompanyCard';
import { RoundtripToggle } from './RoundtripToggle';
import { hasRoundtripShipping } from '../../../utils/roundtrip';

interface ConnectedCompanyProps {
  order: OrderDetails;
  integration: DeliveryIntegration;
  apiKey?: string;
  isCreating: boolean;
  isCreationBlocked?: boolean;
  createLabel: string;
  isAdditional: boolean;
  onCancelAdditional: () => void;
  onCreateDelivery: (packNum: string, deliveryType: string, roundtrip?: boolean) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
  onStatusChanged: () => void;
}

export const ConnectedCompany: React.FC<ConnectedCompanyProps> = ({
  order,
  integration,
  apiKey,
  isCreating,
  isCreationBlocked,
  createLabel, isAdditional, onCancelAdditional,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
  onStatusChanged,
}) => {
  const [packageCount, setPackageCount] = React.useState<number>(1);
  
  // This would come from your settings or context in a real app
  const businessAddress = {
    address: order.shipping.address_1,
    city: order.shipping.city,
  };
  
  const shippingTitle = order.shipping_lines?.length ? order.shipping_lines[0].method_title : '';
  const isPickupDelivery = shippingTitle.includes('נקודות חלוקה') || shippingTitle.includes('נקודת חלוקה') || shippingTitle.includes('epost') || shippingTitle.includes('נקודת איסוף') || shippingTitle.includes('נקודות איסוף');
  const [deliveryType, setDeliveryType] = React.useState<'client' | 'pickup'>(isPickupDelivery ? 'pickup' : 'client');
  // Delivery + pickup in one visit (exchanges): only LionWheel carriers (Mahir Li, ZipGo) support it.
  const canRoundtrip = integration.programType === DeliveryProgramType.LION_WHEEL;
  // An exchange order (round-trip shipping line) starts with it on; never for an additional shipment, or the courier would collect twice.
  const autoRoundtrip = canRoundtrip && !isAdditional && hasRoundtripShipping(order.shipping_lines);
  const [roundtrip, setRoundtrip] = React.useState(autoRoundtrip);
  React.useEffect(() => setRoundtrip(autoRoundtrip), [autoRoundtrip]);
  const sendRoundtrip = canRoundtrip && roundtrip;

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
            isCreating={isCreating || isCreationBlocked || !!deliveryResponse}
            onCountChange={setPackageCount}
            maxCount={maxPackagesPerShipment(integration.provider)}
            hint={packageLimitHint(integration.provider)}
          />

          <DeliveryAddress 
            address={businessAddress.address}
            city={businessAddress.city}
            deliveryType={deliveryType}
            onDeliveryTypeChange={setDeliveryType}
            programType={integration.provider.toLowerCase()}
          />
          
          {canRoundtrip && !deliveryResponse && (
            <RoundtripToggle
              checked={roundtrip}
              onChange={setRoundtrip}
              disabled={isCreating || !!isCreationBlocked}
            />
          )}

          <ConnectionStatus 
            apiKey={apiKey}
            isCreating={isCreating}
            deliveryResponse={deliveryResponse}
          />
          
          <ActionButtons 
            order={order}
            provider={integration.provider}
            deliveryResponse={deliveryResponse}
            isCreating={isCreating}
            isCompleting={isCompleting}
            isCreationBlocked={isCreationBlocked}
            createLabel={sendRoundtrip ? `${isAdditional ? 'הזמן משלוח נוסף' : 'הפק משלוח'} + איסוף ב${integration.name}` : createLabel}
            isAdditional={isAdditional}
            onCancelAdditional={onCancelAdditional}
            onCreateDelivery={() => onCreateDelivery(packageCount.toString(), deliveryType.toString(), sendRoundtrip)}
            onComplete={onComplete}
            packNum={deliveryResponse?.package_count ?? packageCount.toString()}
            deliveryType={deliveryType.toString()} 
            onStatusChanged={onStatusChanged}
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
