import React from 'react';
import { X } from 'lucide-react';
import { SettingsTabs } from './tabs/SettingsTabs';
import { UserProfile } from './profile/UserProfile';
import { useAppState } from '../../hooks/useAppState';
import type { SettingsFormData } from '../../types/settings';

interface SettingsModalProps {
  initialData?: SettingsFormData;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialData,
  onClose,
}) => {
  const { handleSettingsSave } = useAppState();

  const handleSave = async (data: SettingsFormData) => {
    const success = await handleSettingsSave(data);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">הגדרות מערכת</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            aria-label="סגור"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Sidebar - Static position on mobile */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-l bg-gray-50 p-4 sm:p-6 sm:sticky sm:top-0">
            <UserProfile />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <SettingsTabs 
              initialData={initialData}
              onClose={onClose}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};