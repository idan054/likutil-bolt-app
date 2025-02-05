import React, { useState } from 'react';
import { WooCommerceSettingsForm } from './WooCommerceSettingsForm';
import { ChevronDown } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            עיר
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
            placeholder="הזן את שם העיר"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            כתובת
          </label>
          <input
            type="text"
            value={data.address || ''}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            placeholder="הזן את הכתובת"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronDown
            className={`transform transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
            size={20}
          />
          <span className="text-sm">הגדרות מתקדמות</span>
        </button>

        {/* API Credentials Form */}
        <div
          className={`transition-all duration-200 overflow-hidden ${
            showAdvanced ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <WooCommerceSettingsForm
            data={data}
            onChange={onChange}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};