import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { getUserSettings, saveUserSettings } from '../services/settings/settings.service';
import { settingsStorage } from '../services/settings/storage';
import { toast } from 'react-hot-toast';
import type { UserSettings } from '../types/settings';
import { getOrdersStatuses } from "../services/orders/orders.service";
import { OrderStatus } from '../types/order';

const ORDER_STATUSES_KEY = 'order_statuses';

const getStoredOrderStatuses = (): OrderStatus[] => {
  try {
    const stored = localStorage.getItem(ORDER_STATUSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeOrderStatuses = (statuses: OrderStatus[]): void => {
  try {
    localStorage.setItem(ORDER_STATUSES_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error('[useSettings] Failed to store order statuses:', error);
  }
};

export const useSettings = () => {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = useState<UserSettings | null>(() => settingsStorage.get());
  const [isLoading, setIsLoading] = useState(true);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>(getStoredOrderStatuses());

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchSettings = useCallback(async () => {
    // Prevent simultaneous or too frequent fetches (throttle to once per 2 seconds)
    if (isFetchingRef.current || (Date.now() - lastFetchTimeRef.current < 2000)) return;
    
    const userId = user?.uid;
    if (!userId) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = Date.now();

    try {
      const userSettings = await getUserSettings(userId);
      
      if (userSettings) {
        setSettings(userSettings);
        settingsStorage.set(userSettings);
        
        // Fetch order statuses only if we don't have them cached
        if (!orderStatuses.length) {
          const statuses = await getOrdersStatuses();
          setOrderStatuses(statuses);
          storeOrderStatuses(statuses);
        }
      } else {
        settingsStorage.clear();
        setSettings(null);
      }
    } catch (error) {
      console.error('[useSettings] Failed to fetch settings:', error);
      // No toast.error here to avoid flickering in case of minor issues
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSettings();

    // Listen for settings changes
    const unsubscribe = settingsStorage.addListener(() => {
      setSettings(settingsStorage.get());
    });

    return () => unsubscribe();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: UserSettings): Promise<boolean> => {
    const userId = user?.uid;
    if (!userId) return false;

    try {
      await saveUserSettings(userId, newSettings);
      setSettings(newSettings);
      settingsStorage.set(newSettings);
      toast.success('ההגדרות נשמרו בהצלחה');
      return true;
    } catch (error) {
      console.error('[useSettings] Failed to update settings:', error);
      toast.error('שגיאה בשמירת ההגדרות');
      return false;
    }
  };

  return {
    user,
    settings,
    isLoading,
    updateSettings,
    refetchSettings: fetchSettings,
    orderStatuses, // Add this to the return object
  };
};