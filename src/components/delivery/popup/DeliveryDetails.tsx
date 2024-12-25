import React from 'react';
import { ResponseField } from '../ResponseField';
import type { DeliveryTaskResponse } from '../../../services/delivery/types';
import type { DeliveryProvider } from '../DeliverySelector';

interface DeliveryDetailsProps {
  response: DeliveryTaskResponse;
  provider: DeliveryProvider;
}

export const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({ response, provider }) => {
  // Only show detailed tracking info for MahirLi
  if (provider === 'mahirLi') {
    return (
      <div className="space-y-4 text-right">
        <ResponseField 
          label="מספר משלוח" 
          value={response.public_id} 
        />
        <ResponseField 
          label="מספר מעקב" 
          value={response.barcode} 
        />
        <ResponseField 
          label="אזור חלוקה" 
          value={response.destination_region_str} 
        />
      </div>
    );
  }

  // For other providers, don't show any fields
  return null;
};