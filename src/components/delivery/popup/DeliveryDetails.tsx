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
    // The proxy returns the tracking number in `track_number`; the public_id is
    // embedded in the print label URL (?public_id=XXXX).
    let publicId = response.public_id || '';
    if (!publicId && response.print_label) {
      const match = /[?&]public_id=([^&]+)/i.exec(response.print_label);
      if (match) publicId = decodeURIComponent(match[1]);
    }

    return (
      <div className="space-y-4 text-right">
        <ResponseField
          label="מספר מעקב"
          value={response.track_number}
        />
        {publicId && (
          <ResponseField
            label="מזהה משלוח"
            value={publicId}
          />
        )}
      </div>
    );
  }

  // For other providers, don't show any fields
  return null;
};