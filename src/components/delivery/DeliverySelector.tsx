import React from 'react';
import { translations } from '../../config/translations';
import { RoleBadge } from '../ui/RoleBadge';
import { LocalPickupMarker } from '../order/LocalPickupMarker';
import { DeliveryCarousel } from './selector/DeliveryCarousel';
import { DeliveryCompanyInfo } from './selector/DeliveryCompanyInfo';
import { useDeliveryIntegrations } from '../../hooks/settings/useDeliveryIntegrations';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import type { DeliveryTaskResponse } from '../../services/delivery/types';
import { Ban, CheckCheck, CheckCircle, Loader2, Tag, Tags } from 'lucide-react';
import { updateOrderStatus } from '../../services/orders/orders.service';
import { useDeliveryCompanies } from '../../hooks/delivery/useDeliveryCompanies';
import { OrderDetails } from '../../types/order';


interface DeliverySelectorProps {
  order: OrderDetails;
  onSelect: (provider: string) => void;
  selectedProvider: string | null;
  customerId: number | null;
  isLocalPickup?: boolean;
  isCreating: boolean;
  onCreateDelivery: (packNum: string, deliveryType: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
  orderId?: string; 
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  order,
  onSelect,
  selectedProvider,
  customerId,
  isLocalPickup,
  isCreating,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
  orderId
}) => {
  

  const { customer, isLoading: isLoadingCustomer } = useCustomerDetails(customerId);
  const { companies } = useDeliveryCompanies();
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const { integrations, savedData } = useDeliveryIntegrations();
  
  // Create a set of connected provider IDs
  const connectedProviders = new Set(
    integrations
      .filter(integration => integration.isConnected)
      .map(integration => integration.provider)
  );

  // Find selected integration
  const selectedIntegration = integrations.find(
    integration => integration.provider === selectedProvider
  );


  return (
    <div key={order.id} className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-right">
          {companies.length == 1 ? translations.deliveryOptions.open : translations.deliveryOptions.title}
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
        order={order} 
          integration={selectedIntegration}
          apiKey={savedData[selectedIntegration.provider]?.key}
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