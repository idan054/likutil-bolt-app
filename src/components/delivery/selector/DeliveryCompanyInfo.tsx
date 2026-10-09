import React from 'react';
import { ConnectedCompany } from '../company/ConnectedCompany';
import { NonConnectedCompany } from '../company/NonConnectedCompany';
import type { DeliveryIntegration } from '../../../types/delivery';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import { OrderDetails } from '../../../types/order';


interface DeliveryCompanyInfoProps {
  order: OrderDetails;
  integration: DeliveryIntegration;
  apiKey?: string;
  isCreating: boolean;
  isCreationBlocked?: boolean;
  createLabel: string;
  isAdditional: boolean;
  onCancelAdditional: () => void;
  onCreateDelivery: (packNum: string, deliveryType: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
  onStatusChanged: () => void;
}

export const DeliveryCompanyInfo: React.FC<DeliveryCompanyInfoProps> = ({
  order,
  integration,
  ...props
}) => {
  if (!integration.isConnected) {
    return <NonConnectedCompany integration={integration} />;
  }

  // Asking for an additional shipment starts the panel afresh, so its package counter is back at 1
  // and the count of the shipment that already went out does not carry over.
  return (
    <ConnectedCompany
      key={`${order.id}:${props.isAdditional ? 'additional' : 'first'}`}
      order={order}
      integration={integration}
      {...props}
    />
  );
};
