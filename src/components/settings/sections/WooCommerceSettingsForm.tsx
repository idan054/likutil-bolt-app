import React from 'react';
import { FormField } from '../../../ui/FormField';
import type { SettingsFormData } from '../../../../types/settings';

interface WooCommerceSettingsFormProps {
  data: SettingsFormData;
  onChange: (data: SettingsFormData) => void;
  isSubmitting: boolean;
}

export const WooCommerceSettingsForm: React.FC<WooCommerceSettingsFormProps> = ({
  data,
  onChange,
  isSubmitting,
}) => {
  const handleChange = (field: keyof SettingsFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...data,
      [field]: e.target.value.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        label="כתובת החנות"
        type="text"
        value={data.storeUrl}
        onChange={handleChange('storeUrl')}
        placeholder="example.com"
        disabled={isSubmitting}
        required
        className="w-full text-sm sm:text-base"
      />

      <FormField
        label="Consumer Key"
        type="text"
        value={data.consumerKey}
        onChange={handleChange('consumerKey')}
        placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        disabled={isSubmitting}
        required
        className="w-full font-mono text-xs sm:text-sm"
      />

      <FormField
        label="Consumer Secret"
        type="password"
        value={data.consumerSecret}
        onChange={handleChange('consumerSecret')}
        placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        disabled={isSubmitting}
        required
        className="w-full font-mono text-xs sm:text-sm"
      />
    </div>
  );
};