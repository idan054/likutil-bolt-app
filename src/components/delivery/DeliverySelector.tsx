import React from 'react';
import { translations } from '../../config/translations';
import { RoleBadge } from '../ui/RoleBadge';
import { LocalPickupMarker } from '../order/LocalPickupMarker';
import { DeliveryCarousel } from './selector/DeliveryCarousel';
import { DeliveryCompanyInfo } from './selector/DeliveryCompanyInfo';
import { useDeliveryIntegrations } from '../../hooks/settings/useDeliveryIntegrations';
import { useDeliverySelection } from '../../hooks/useDeliverySelection';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import type { DeliveryProvider } from './DeliverySelector';
import type { DeliveryTaskResponse } from '../../services/delivery/types';

export type DeliveryProvider = 'mahirLi' | 'cargo' | 'sale4u';

interface DeliverySelectorProps {
  onSelect: (provider: DeliveryProvider) => void;
  selectedProvider: DeliveryProvider | null;
  customerId: number | null;
  isLocalPickup?: boolean;
  isCreating: boolean;
  onCreateDelivery: (packNum: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  onSelect,
  selectedProvider,
  customerId,
  isLocalPickup,
  isCreating,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
}) => {
  const { customer, isLoading: isLoadingCustomer } = useCustomerDetails(customerId);
  const { integrations, savedData } = useDeliveryIntegrations();
  
  // Create a set of connected provider IDs
  const connectedProviders = new Set(
    integrations
      .filter(integration => integration.isConnected)
      .map(integration => integration.id)
  );

  // Find selected integration
  const selectedIntegration = integrations.find(
    integration => integration.id === selectedProvider
  );

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-right">
          {translations.deliveryOptions.title}
        </h3>
        <div className="flex items-center gap-2">
          <RoleBadge 
            role={customer?.role} 
            isLoading={isLoadingCustomer}
          />
          {isLocalPickup && <LocalPickupMarker />}
        </div>
      </div>
      
      <DeliveryCarousel
        selectedProvider={selectedProvider}
        onSelect={onSelect}
        connectedProviders={connectedProviders}
      />

      {selectedIntegration && (
        <DeliveryCompanyInfo 
          integration={selectedIntegration}
          apiKey={savedData[selectedIntegration.id]?.key}
          isCreating={isCreating}
          onCreateDelivery={onCreateDelivery}
          deliveryResponse={deliveryResponse}
          onComplete={onComplete}
          isCompleting={isCompleting}
        />
      )}
    </div>
  );
};