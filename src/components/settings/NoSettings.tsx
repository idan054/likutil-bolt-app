import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '../../hooks/useSettings';
import { useAppState } from '../../hooks/useAppState';

export const NoSettings: React.FC = () => {
  const [showSettings, setShowSettings] = useState(true);
  const { updateSettings } = useSettings();
  const { refetchOrders } = useAppState();

  const handleSave = async (data: SettingsFormData) => {
    const success = await updateSettings(data);
    if (success) {
      await refetchOrders();
      setShowSettings(false);
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Settings size={32} className="text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">הגדרות חסרות</h2>
        <p className="text-gray-600 mb-6">
          נדרשת הגדרת חיבור לחנות WooCommerce כדי להשתמש במערכת.
          אנא הזן את פרטי החיבור בהגדרות.
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          הגדר עכשיו
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          onSave={handleSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};