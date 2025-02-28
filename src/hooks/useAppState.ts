import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import { useProcessingOrders } from "./useProcessingOrders";
import { toast } from "react-hot-toast";
import { UserSettings } from "../types/settings";
import { useSettings } from "./useSettings";

export const useAppState = () => {
  const [user, loading] = useAuthState(auth);
  const {
    settings,
    isLoading: isLoadingSettings,
    updateSettings,
  } = useSettings();

  const {
    orders,
    isLoading: isLoadingOrders,
    isRefetching,
    refetch: refetchOrders,
  } = useProcessingOrders();

  const [isInitialized, setIsInitialized] = useState(false);
  const initialFetchRef = useRef(false);

  // Handle initialization and data fetching
  useEffect(() => {
    if (!loading) {
      if (user && settings && !initialFetchRef.current) {
        // Only fetch once during initialization
        refetchOrders();
        initialFetchRef.current = true;
      }
      setIsInitialized(true);
    }
  }, [user, loading, settings]); // Keep refetchOrders out to prevent loops

  const handleSettingsSave = useCallback(
    async (formData: UserSettings) => {
      const toastId = "settings-save";
      toast.loading("שומר הגדרות...", { id: toastId });

      try {
        const success = await updateSettings(formData);
        if (success) {
          toast.success("ההגדרות נשמרו בהצלחה", { id: toastId });
          // Intentional refetch after settings update
          await refetchOrders();
          return true;
        }
        toast.error("שגיאה בשמירת ההגדרות", { id: toastId });
        return false;
      } catch (error) {
        console.error("[useAppState] Failed to save settings:", error);
        toast.error("שגיאה בשמירת ההגדרות", { id: toastId });
        return false;
      }
    },
    [updateSettings, refetchOrders]
  );

  return {
    isInitialized,
    hasSettings: !!settings,
    isLoading: loading || isLoadingSettings || isLoadingOrders,
    isRefetching,
    orders,
    refetchOrders,
    handleSettingsSave,
  };
};
