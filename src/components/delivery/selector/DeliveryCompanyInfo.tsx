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
  onCreateDelivery: (packNum: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const DeliveryCompanyInfo: React.FC<DeliveryCompanyInfoProps> = ({
  order,
  integration,
  ...props
}) => {
  if (!integration.isConnected) {
    return <NonConnectedCompany integration={integration} />;
  }

  return <ConnectedCompany key={order.id} order={order} integration={integration} {...props} />;
};