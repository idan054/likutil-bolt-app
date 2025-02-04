import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../config/firebase';
import { useSettingsUpdate } from '../../hooks/settings/useSettingsUpdate';
import { FormField } from '../ui/FormField';
import { Save } from 'lucide-react';
import type { UserSettings } from '../../types/settings';

interface SettingsFormProps {
  initialData?: UserSettings;
  onSuccess?: () => void;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialData,
  onSuccess
}) => {
  const [user] = useAuthState(auth);
  const { updateSettings, isUpdating } = useSettingsUpdate(user?.uid || '');
  const [formData, setFormData] = React.useState<UserSettings>({
    storeUrl: initialData?.storeUrl || '',
    consumerKey: initialData?.consumerKey || '',
    consumerSecret: initialData?.consumerSecret || '',
    city: initialData?.city || '',
    address: initialData?.address || '',
  });

  // Debug log to check form state
  React.useEffect(() => {
    console.log('Form Data:', formData);
    console.log('Is Form Valid:', isFormValid());
  }, [formData]);

  const isFormValid = () => {
    return Boolean(
      formData.storeUrl?.trim() &&
      formData.consumerKey?.trim() &&
      formData.consumerSecret?.trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid()) return;

    const success = await updateSettings(formData);
    if (success) {
      onSuccess?.();
    }
  };

  const handleChange = (field: keyof UserSettings) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store URL Field - Most important, so we put it first */}
      <div className="space-y-4">
        <FormField
          label="כתובת האתר"
          type="text"
          value={formData.storeUrl}
          onChange={handleChange('storeUrl')}
          placeholder="example.com"
          disabled={isUpdating}
          required
          className="font-mono text-sm"
        />
      </div>

      {/* API Credentials */}
      <div className="space-y-4">
        <FormField
          label="Consumer Key"
          type="text"
          value={formData.consumerKey}
          onChange={handleChange('consumerKey')}
          placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          disabled={isUpdating}
          required
          className="font-mono text-sm"
        />

        <FormField
          label="Consumer Secret"
          type="text"
          value={formData.consumerSecret}
          onChange={handleChange('consumerSecret')}
          placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          disabled={isUpdating}
          required
          className="font-mono text-sm"
        />
      </div>

      {/* Optional Business Details */}
      <div className="border-t pt-6">
        <h3 className="text-gray-500 text-sm mb-4">פרטי העסק (לא חובה)</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="עיר"
            type="text"
            value={formData.city}
            onChange={handleChange('city')}
            placeholder="הזן את שם העיר"
            disabled={isUpdating}
          />
          <FormField
            label="כתובת"
            type="text"
            value={formData.address}
            onChange={handleChange('address')}
            placeholder="הזן את הכתובת"
            disabled={isUpdating}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isUpdating || !isFormValid()}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
            isFormValid()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save size={20} />
          <span>{isUpdating ? 'שומר...' : 'שמור'}</span>
        </button>
      </div>
    </form>
  );
};