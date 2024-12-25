import React, { useState } from 'react';
import { Store, Truck, Save } from 'lucide-react';
import { TabButton } from './TabButton';
import { WooCommerceSettings } from './sections/WooCommerceSettings';
import { DeliverySettings } from './sections/delivery/DeliverySettings';
import { useSettingsSave } from '../../../hooks/settings/useSettingsSave';
import type { SettingsFormData } from '../../../types/settings';

interface SettingsTabsProps {
  initialData?: SettingsFormData;
  onClose: () => void;
  onSave: (data: SettingsFormData) => Promise<void>;
}

type TabId = 'store' | 'delivery';

export const SettingsTabs: React.FC<SettingsTabsProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const [formData, setFormData] = useState<SettingsFormData>(
    initialData || {
      storeUrl: '',
      consumerKey: '',
      consumerSecret: '',
    }
  );

  const { saveSettings, isSaving } = useSettingsSave(async (data) => {
    await onSave(data);
  });

  const isFormValid = () => {
    return (
      formData.storeUrl?.trim() !== '' &&
      formData.consumerKey?.trim() !== '' &&
      formData.consumerSecret?.trim() !== ''
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    await saveSettings(formData);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Container */}
      <div className="mb-6">
        {/* Tabs - Grid on mobile, flex on desktop */}
        <div className="grid grid-cols-2 sm:flex gap-2">
          <TabButton
            icon={Store}
            label="חיבור לחנות שלך"
            isActive={activeTab === 'store'}
            onClick={() => setActiveTab('store')}
          />
          <TabButton
            icon={Truck}
            label="חיבור לחברות המשלוחים"
            isActive={activeTab === 'delivery'}
            onClick={() => setActiveTab('delivery')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto mb-6">
        {activeTab === 'store' && (
          <WooCommerceSettings
            data={formData}
            onChange={setFormData}
            isSubmitting={isSaving}
          />
        )}
        {activeTab === 'delivery' && <DeliverySettings />}
      </div>

      {/* Actions */}
      {activeTab === 'store' && (
        <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !isFormValid()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
              isFormValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={20} />
            <span>{isSaving ? 'שומר...' : 'שמור'}</span>
          </button>
        </div>
      )}
    </div>
  );
};