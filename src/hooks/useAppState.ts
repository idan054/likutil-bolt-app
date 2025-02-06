import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import { useSettings } from "./settings";
import { useProcessingOrders } from "./useProcessingOrders";
import { toast } from "react-hot-toast";

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

  // Handle initialization and data fetching
  useEffect(() => {
    if (!loading) {
      if (user && settings) {
        refetchOrders();
      }
      setIsInitialized(true);
    }
  }, [user, loading, settings, refetchOrders]);

  // Determine if the app is in a loading state
  const isLoading =
    loading || isLoadingSettings || isLoadingOrders || !isInitialized;

  const handleSettingsSave = useCallback(
    async (formData) => {
      const toastId = "settings-save";
      toast.loading("שומר הגדרות...", { id: toastId });

      try {
        const success = await updateSettings(formData);
        if (success) {
          toast.success("ההגדרות נשמרו בהצלחה", { id: toastId });
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
    isLoading,
    isRefetching,
    orders,
    refetchOrders,
    handleSettingsSave,
  };
};
