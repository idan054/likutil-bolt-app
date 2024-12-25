import React from 'react';
import { ConnectedCompany } from '../company/ConnectedCompany';
import { NonConnectedCompany } from '../company/NonConnectedCompany';
import type { DeliveryIntegration } from '../../../types/delivery';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';

interface DeliveryCompanyInfoProps {
  integration: DeliveryIntegration;
  apiKey?: string;
  isCreating: boolean;
  onCreateDelivery: (packNum: string) => void;
  deliveryResponse: DeliveryTaskResponse | null;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export const DeliveryCompanyInfo: React.FC<DeliveryCompanyInfoProps> = ({
  integration,
  ...props
}) => {
  if (!integration.isConnected) {
    return <NonConnectedCompany integration={integration} />;
  }

  return <ConnectedCompany integration={integration} {...props} />;
};