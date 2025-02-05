import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useSettings } from './settings';
import { useProcessingOrders } from './useProcessingOrders';
import { useDebugAuth } from './useDebugAuth';
import { toast } from 'react-hot-toast';

export const useAppState = () => {
  const [user, loading] = useAuthState(auth);
  const { isEnabled: isDebugMode, mockUser } = useDebugAuth();
  const { settings, isLoading: isLoadingSettings, updateSettings } = useSettings();
  const { 
    orders, 
    isLoading: isLoadingOrders, 
    refetch: refetchOrders 
  } = useProcessingOrders();
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle initialization and data fetching
  useEffect(() => {
    const currentUser = isDebugMode ? mockUser : user;
    
    if (!loading) {
      if (currentUser && settings) {
        refetchOrders();
      }
      setIsInitialized(true);
    }
  }, [user, loading, settings, refetchOrders, isDebugMode, mockUser]);

  const handleSettingsSave = useCallback(async (formData) => {
    const toastId = 'settings-save';
    toast.loading('שומר הגדרות...', { id: toastId });

    try {
      const success = await updateSettings(formData);
      if (success) {
        toast.success('ההגדרות נשמרו בהצלחה', { id: toastId });
        await refetchOrders();
        return true;
      }
      toast.error('שגיאה בשמירת ההגדרות', { id: toastId });
      return false;
    } catch (error) {
      console.error('[useAppState] Failed to save settings:', error);
      toast.error('שגיאה בשמירת ההגדרות', { id: toastId });
      return false;
    }
  }, [updateSettings, refetchOrders]);

  return {
    isInitialized,
    hasSettings: !!settings,
    isLoading: loading || isLoadingSettings || isLoadingOrders,
    orders,
    refetchOrders,
    handleSettingsSave,
  };
};