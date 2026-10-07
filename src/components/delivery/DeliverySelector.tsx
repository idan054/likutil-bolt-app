import React from 'react';
import { translations } from '../../config/translations';
import { RoleBadge } from '../ui/RoleBadge';
import { LocalPickupMarker } from '../order/LocalPickupMarker';
import { DeliveryCarousel } from './selector/DeliveryCarousel';
import { DeliveryCompanyInfo } from './selector/DeliveryCompanyInfo';
import { useDeliveryIntegrations } from '../../hooks/settings/useDeliveryIntegrations';
import { useCustomerDetails } from '../../hooks/useCustomerDetails';
import type { DeliveryTaskResponse, ShipmentState } from '../../services/delivery/types';
import { useDeliveryCompanies } from '../../hooks/delivery/useDeliveryCompanies';
import { OrderDetails } from '../../types/order';
import { ShipmentActionsDialog } from './ShipmentActionsDialog';


interface DeliverySelectorProps {
  order: OrderDetails;
  onSelect: (provider: string) => void;
  selectedProvider: string | null;
  customerId: number | null;
  isLocalPickup?: boolean;
  isCreating: boolean;
  isCreationBlocked?: boolean;
  shipments: DeliveryTaskResponse[];
  isChecking: boolean;
  shipmentMessage: string;
  shipmentState?: ShipmentState | null;
  canRequestAdditional: boolean;
  isAdditional: boolean;
  onRequestAdditional: () => void;
  onCancelAdditional: () => void;
  onCancelShipment: (shipment: DeliveryTaskResponse) => Promise<boolean>;
  onCheckShipment: () => void;
  onCreateDelivery: (packNum: string, deliveryType: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
  onStatusChanged: () => void;
  orderId?: string; 
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  order,
  onSelect,
  selectedProvider,
  customerId,
  isLocalPickup,
  isCreating,
  isCreationBlocked,
  shipments, isChecking, shipmentMessage, shipmentState, canRequestAdditional, isAdditional,
  onRequestAdditional, onCancelAdditional, onCancelShipment, onCheckShipment,
  onCreateDelivery,
  deliveryResponse,
  onComplete,
  isCompleting,
  onStatusChanged
}) => {
  

  const { customer, isLoading: isLoadingCustomer } = useCustomerDetails(customerId);
  const { companies } = useDeliveryCompanies();
  const [actionsProvider, setActionsProvider] = React.useState<string | null>(null);
  const { integrations, savedData } = useDeliveryIntegrations();
  
  // Create a set of connected provider IDs
  const connectedProviders = new Set(
    integrations
      .filter(integration => integration.isConnected)
      .map(integration => integration.provider)
  );

  // Find selected integration
  const displayedProvider = selectedProvider || deliveryResponse?.provider || null;
  const selectedIntegration = integrations.find(
    integration => integration.provider === displayedProvider
  ) ?? integrations.find(integration => integration.provider === selectedProvider);
  const selectProvider = React.useCallback((provider: string) => {
    if (isCreating) return;
    onSelect(provider);
    setActionsProvider(provider);
    onCheckShipment();
  }, [isCreating, onSelect, onCheckShipment]);
  const companyShipments = shipments.filter(shipment => shipment.provider === actionsProvider && !shipment.cancelled);
  const actionsCompany = integrations.find(integration => integration.provider === actionsProvider);
  const allShipmentsCancelled = shipments.length > 0 && shipments.every(shipment => shipment.cancelled);
  React.useEffect(() => {
    if (!isChecking && companyShipments.length === 0 && (!shipmentMessage || allShipmentsCancelled)) setActionsProvider(null);
  }, [isChecking, shipmentMessage, companyShipments.length, allShipmentsCancelled]);


  return (
    <div key={order.id} className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-right">
          {companies.length == 1 ? translations.deliveryOptions.open : translations.deliveryOptions.title}
        </h3>
        <div className="flex items-center gap-2">
          <RoleBadge 
            role={customer?.role} 
            isVipMember={order.is_vip_member ?? customer?.is_vip_member}
            isLoading={isLoadingCustomer}
          />
          {isLocalPickup && <LocalPickupMarker />}
        </div>
      </div>
      
      <DeliveryCarousel
        selectedProvider={displayedProvider}
        onSelect={selectProvider}
        onAutoSelect={onSelect}
        isDisabled={isCreating}
        connectedProviders={connectedProviders}
      />

      {actionsProvider && actionsCompany && <ShipmentActionsDialog
        key={`actions:${order.id}:${actionsProvider}`} order={order} companyName={actionsCompany.name}
        shipments={companyShipments} isChecking={isChecking} isBusy={isCreating}
        message={shipmentMessage} canRequestAdditional={canRequestAdditional}
        resultUnknown={shipmentState?.state !== 'created' && Boolean(shipmentMessage)}
        relatedShipments={shipmentState?.related_shipments?.map(candidate => ({ ...candidate,
          company_name: integrations.find(integration => integration.provider === candidate.provider)?.name ?? 'חברת המשלוחים הקודמת' }))}
        checkedAt={shipmentState?.lookup_checked_at}
        lookupCompleted={shipmentState?.lookup_completed && shipmentMessage === shipmentState.message}
        onAdditional={() => { onRequestAdditional(); setActionsProvider(null); }}
        onCancelShipment={onCancelShipment} onCheck={onCheckShipment} onClose={() => setActionsProvider(null)}
      />}
      {!actionsProvider && (isChecking || shipmentMessage) && <div role="status" className="my-3 rounded-lg bg-slate-50 p-3 text-sm">
        {isChecking ? 'בודק מצב משלוחים…' : shipmentMessage}
        {!isChecking && <button onClick={onCheckShipment} disabled={isCreating} className="mr-2 font-semibold text-blue-700 underline">בדוק מצב משלוח</button>}
      </div>}

      {selectedIntegration && (
        <DeliveryCompanyInfo
        key={`${order.id}:${selectedIntegration.provider}`}
        order={order} 
          integration={selectedIntegration}
          apiKey={savedData[selectedIntegration.provider]?.key}
          isCreating={isCreating}
          isCreationBlocked={isCreationBlocked}
          createLabel={`${isAdditional ? 'הזמן משלוח נוסף' : 'הפק משלוח'} ב${selectedIntegration.name}`}
          isAdditional={isAdditional}
          onCancelAdditional={() => {
            onCancelAdditional();
            if (selectedProvider) selectProvider(selectedProvider);
          }}
          onCreateDelivery={onCreateDelivery}
          deliveryResponse={deliveryResponse}
          onComplete={onComplete}
          isCompleting={isCompleting}
          onStatusChanged={onStatusChanged}
        />
      )}

    
    

    </div>
  );
};
