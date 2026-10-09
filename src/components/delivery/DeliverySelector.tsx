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
import { preferredSiteProvider, providerForSiteCarrier, siteBlockedProviders } from '../../utils/siteCarrier';


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

  // The site chose a courier this account is not connected to (for example ZipGo before its token was
  // entered): move to the site's fallback courier instead of leaving the picker with no card selected.
  const connectedKey = Array.from(connectedProviders).sort().join(',');
  React.useEffect(() => {
    if (!selectedProvider || !connectedKey || isCreating || deliveryResponse) return;
    if (connectedProviders.has(selectedProvider)) return;
    if (selectedProvider !== providerForSiteCarrier(order.s3_carrier?.use)) return;
    const next = preferredSiteProvider(order.s3_carrier, connectedProviders);
    if (next && next !== selectedProvider) onSelect(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, connectedKey, order.id]);

  // What the site decided, in words, for the picker
  const siteProviderId = providerForSiteCarrier(order.s3_carrier?.use);
  const siteCompanyName = integrations.find(integration => integration.provider === siteProviderId)?.name;
  const siteCompanyMissing = Boolean(siteProviderId && connectedKey && !connectedProviders.has(siteProviderId));
  const siteNote = order.s3_carrier?.use
    ? ['לפי האתר', siteCompanyName, order.s3_carrier.line, siteCompanyMissing ? 'החברה הזו לא מחוברת בחשבון הזה' : '']
        .filter(Boolean).join(' · ')
    : '';

  // Couriers the site says do not reach this order's town: their card is grey and cannot be clicked.
  // A courier that already holds a live shipment for this order stays clickable, so it can be managed or cancelled.
  const blockedProviders = Object.fromEntries(
    Object.entries(siteBlockedProviders(order.s3_carrier)).filter(
      ([provider]) => !shipments.some(shipment => shipment.provider === provider && !shipment.cancelled)
    )
  );

  // Find selected integration
  const displayedProvider = selectedProvider || deliveryResponse?.provider || null;
  const selectedBlockedReason = displayedProvider ? blockedProviders[displayedProvider] : undefined;
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
      
      {siteNote && (
        <div role="note" className="mb-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-right text-sm text-teal-900">
          {siteNote}
        </div>
      )}

      <DeliveryCarousel
        selectedProvider={displayedProvider}
        onSelect={selectProvider}
        onAutoSelect={onSelect}
        isDisabled={isCreating}
        connectedProviders={connectedProviders}
        blockedProviders={blockedProviders}
      />

      {selectedBlockedReason && (
        <div role="alert" className="my-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-right text-sm text-red-800">
          {selectedIntegration?.name ?? 'החברה שנבחרה'} {selectedBlockedReason}. בחרו חברה אחרת.
        </div>
      )}

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

      {selectedIntegration && !selectedBlockedReason && (
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
