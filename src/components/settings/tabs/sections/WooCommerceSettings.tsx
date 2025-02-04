import React, { useState } from 'react';
import { WooCommerceInfoBox } from './WooCommerceInfoBox';
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
      {/* WooCommerce Info Box */}
      <WooCommerceInfoBox />

      {/* Store URL - Most important field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          כתובת האתר
        </label>
        <input
          type="text"
          value={data.storeUrl || ''}
          onChange={(e) => onChange({ ...data, storeUrl: e.target.value })}
          placeholder="example.com"
          className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
          required
        />
      </div>

      {/* Business Details */}
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
          type="button"
        >
          <ChevronDown
            className={`transform transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`}
            size={20}
          />
          <span className="text-sm">הגדרות מתקדמות</span>
        </button>

        {/* API Credentials */}
        <div
          className={`transition-all duration-200 overflow-hidden ${
            showAdvanced ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consumer Key
              </label>
              <input
                type="text"
                value={data.consumerKey || ''}
                onChange={(e) => onChange({ ...data, consumerKey: e.target.value })}
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consumer Secret
              </label>
              <input
                type="text"
                value={data.consumerSecret || ''}
                onChange={(e) => onChange({ ...data, consumerSecret: e.target.value })}
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};