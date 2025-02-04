import React, { useEffect } from 'react';
import { SettingsFormData } from '../../../types/settings';
import { DEBUG_CONFIG, IS_DEV } from '../../../config/debug';
import { FormField } from '../../ui/FormField';


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
  useEffect(() => {
    if (IS_DEV && DEBUG_CONFIG.AUTH.WOO_CREDENTIALS) {
      onChange({
        ...data,
        storeUrl: DEBUG_CONFIG.AUTH.WOO_CREDENTIALS.STORE_URL,
        consumerKey: DEBUG_CONFIG.AUTH.WOO_CREDENTIALS.CONSUMER_KEY,
        consumerSecret: DEBUG_CONFIG.AUTH.WOO_CREDENTIALS.CONSUMER_SECRET,
      });
    }
  }, []);

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