import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSettings } from "./useSettings";
import type { FastDeliveryRules } from "../types/fastDelivery";
import { getFastDeliveryRules, saveFastDeliveryRules } from "../services/fastDelivery/rules.service";

export const useFastDeliveryRules = () => {
  const { settings } = useSettings();
  const [rules, setRules] = useState<FastDeliveryRules | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!settings?.storeUrl) return;
    setIsLoading(true);
    try {
      const r = await getFastDeliveryRules(settings.storeUrl);
      setRules(r);
    } catch (e: any) {
      toast.error("שגיאה בטעינת כללי מהיר לי");
    } finally {
      setIsLoading(false);
    }
  }, [settings?.storeUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (next: Pick<FastDeliveryRules, "cities" | "blockedKeywords" | "vipRoles">) => {
      if (!settings?.storeUrl) return;
      setIsLoading(true);
      try {
        const updated = await saveFastDeliveryRules(settings.storeUrl, {
          ...next,
          updatedBy: settings.storeUrl, // lightweight
        });
        setRules(updated);
        toast.success("הכללים נשמרו");
      } catch (e: any) {
        toast.error("שמירת כללים נכשלה");
      } finally {
        setIsLoading(false);
      }
    },
    [settings?.storeUrl]
  );

  return { rules, isLoading, reload: load, save };
};
