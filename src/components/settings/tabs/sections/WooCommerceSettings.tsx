import React from 'react';
import { WooCommerceSettingsForm } from './WooCommerceSettingsForm';
import { WooCommerceInfoBox } from './WooCommerceInfoBox';
import { SecurityIndicator } from '../../security/SecurityIndicator';
import type { SettingsFormData } from '../../../../types/settings';

interface WooCommerceSettingsProps {
  data: SettingsFormData;
  onChange: (data: SettingsFormData) => void;
  isSubmitting?: boolean;
}

export const WooCommerceSettings: React.FC<WooCommerceSettingsProps> = ({
  data,
  onChange,
  isSubmitting = false,
}) => {
  return (
    <div className="space-y-6">
      <WooCommerceInfoBox />
      <WooCommerceSettingsForm 
        data={data} 
        onChange={onChange} 
        isSubmitting={isSubmitting} 
      />
    </div>
  );
};