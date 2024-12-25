import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { saveSettingsToFirestore } from '../../services/settings/firestore';
import { settingsStorage } from '../../services/settings/storage';
import { validateSettingsFormat, validateSettingsConnection } from '../../services/settings/validation';
import type { SettingsFormData } from '../../types/settings';

interface UseSettingsSaveResult {
  saveSettings: (data: SettingsFormData) => Promise<boolean>;
  isSaving: boolean;
}

export const useSettingsSave = (
  userId: string,
  onSuccess?: () => void
): UseSettingsSaveResult => {
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async (data: SettingsFormData): Promise<boolean> => {
    if (!validateSettingsFormat(data)) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return false;
    }

    setIsSaving(true);
    const toastId = 'settings-save';
    
    try {
      toast.loading('בודק הגדרות...', { id: toastId });
      
      // Test the connection before saving
      const isValid = await validateSettingsConnection(data);
      if (!isValid) {
        toast.error('שגיאה בהתחברות - אנא בדוק את פרטי החיבור', { id: toastId });
        return false;
      }
      
      // Save to Firestore
      await saveSettingsToFirestore(userId, data);
      
      // Save to local storage
      settingsStorage.set(data);
      
      toast.success('ההגדרות נשמרו בהצלחה', { id: toastId });
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('[useSettingsSave] Failed to save settings:', error);
      toast.error('שגיאה בשמירת ההגדרות', { id: toastId });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSettings, isSaving };
};