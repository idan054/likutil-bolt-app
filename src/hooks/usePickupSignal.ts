import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { getPickupState, isPickupRouteMissing, sendPickup } from "../services/pickup/pickup.service";
import { isPickupDay, type PickupCarrier, type PickupState } from "../utils/pickupSignal";

const REFRESH_MS = 30_000;

/**
 * The pickup state lives on the shop site, so every screen reads the same thing with the regular refresh.
 * `isStale` means the last read failed and the buttons show the last state that was read.
 */
export const usePickupSignal = (enabled: boolean) => {
  const [state, setState] = useState<PickupState | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [busy, setBusy] = useState<PickupCarrier | "all" | null>(null);
  const missingRef = useRef(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled || missingRef.current) return;
    try {
      const next = await getPickupState();
      if (!mountedRef.current) return;
      setState(next);
      setIsStale(false);
    } catch (error) {
      if (!mountedRef.current) return;
      // No route on this shop's site: not asked again until the page is loaded again.
      if (isPickupRouteMissing(error)) {
        missingRef.current = true;
        setState(null);
        return;
      }
      setIsStale(true);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    };
    tick();
    const interval = window.setInterval(tick, REFRESH_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, refresh]);

  const report = useCallback(async (
    carrier: PickupCarrier | "all",
    action: "close" | "reopen",
    by?: string | null
  ) => {
    // Never sent on a day that is not a delivery day, whatever the screen shows.
    if (!isPickupDay(state) || busy) return;
    setBusy(carrier);
    try {
      const next = await sendPickup(carrier, action, by);
      if (!mountedRef.current) return;
      setState(next);
      setIsStale(false);
    } catch {
      if (mountedRef.current) toast.error("הדיווח לא נשמר. יש לנסות שוב.");
    } finally {
      if (mountedRef.current) setBusy(null);
    }
  }, [state, busy]);

  return { state, isStale, busy, report, refresh };
};
