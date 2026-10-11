import React, { useMemo } from "react";
import { Check, Truck } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../config/firebase";
import { settingsStorage } from "../../services/settings";
import { useDeliveryIntegrations } from "../../hooks/settings/useDeliveryIntegrations";
import { usePickupSignal } from "../../hooks/usePickupSignal";
import {
  allPickupClosed,
  isPickupDay,
  pickupButtonLabel,
  pickupCarrierName,
  pickupCarriersFor,
  shouldRemindPickup,
  type PickupCarrier,
  type PickupState,
} from "../../utils/pickupSignal";

interface PickupButtonsProps {
  state: PickupState;
  isStale: boolean;
  busy: PickupCarrier | "all" | null;
  onReport: (carrier: PickupCarrier | "all", action: "close" | "reopen") => void;
  /** Shown while this account has no connected courier to report on. */
  fallback?: React.ReactNode;
}

const BUTTON_BASE =
  "flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-6 py-3 text-lg font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const PickupButtons: React.FC<PickupButtonsProps> = ({ state, isStale, busy, onReport, fallback = null }) => {
  const { integrations } = useDeliveryIntegrations();
  const carriers = useMemo(
    () => pickupCarriersFor(integrations.filter(({ isConnected }) => isConnected).map(({ provider }) => provider)),
    [integrations]
  );
  if (carriers.length === 0) return <>{fallback}</>;

  const allClosed = allPickupClosed(state, carriers);

  const handleCarrier = (carrier: PickupCarrier) => {
    if (!state.carriers[carrier]?.closed) return onReport(carrier, "close");
    if (window.confirm(`לפתוח מחדש את ${pickupCarrierName(carrier)} להיום?`)) onReport(carrier, "reopen");
  };

  const handleAll = () => {
    if (window.confirm("לסמן שכל חברות המשלוחים אספו להיום?")) onReport("all", "close");
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="hidden rounded-full bg-blue-100 p-3 sm:block" title="איסוף שליחים">
          <Truck size={32} className="text-blue-600" />
        </div>
        {carriers.map((carrier) => {
          const carrierState = state.carriers[carrier];
          const closed = Boolean(carrierState?.closed);
          const remind = shouldRemindPickup(state, carrier);
          return (
            <button
              key={carrier}
              type="button"
              onClick={() => handleCarrier(carrier)}
              disabled={busy !== null}
              aria-pressed={closed}
              className={`${BUTTON_BASE} ${
                closed
                  ? "border-green-600 bg-green-100 text-green-900 hover:bg-green-200"
                  : `border-blue-500 bg-white text-blue-800 hover:bg-blue-100 ${
                      remind ? "animate-pulse border-amber-500 ring-4 ring-amber-300" : ""
                    }`
              }`}
            >
              {closed && <Check size={22} />}
              <span>{pickupButtonLabel(carrier, carrierState)}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleAll}
          disabled={busy !== null || allClosed}
          className={`${BUTTON_BASE} border-blue-700 bg-blue-600 text-white hover:bg-blue-700`}
        >
          {allClosed ? "נסגר להיום" : "סיימתי להיום"}
        </button>
      </div>
      {isStale && (
        <p role="status" className="mt-2 text-sm text-amber-800">
          מצב האיסוף לא התעדכן. מוצג המצב האחרון שנקרא.
        </p>
      )}
    </div>
  );
};

/**
 * The "the courier collected" buttons of the blue picking bar. They take the place of the bar's header;
 * when there is nothing to report on, the header (`fallback`) stays.
 */
export const PickupSignalBar: React.FC<{ fallback?: React.ReactNode }> = ({ fallback = null }) => {
  const [user] = useAuthState(auth);
  const isWoo = settingsStorage.get()?.authType !== "shopify";
  const { state, isStale, busy, report } = usePickupSignal(isWoo);

  // No route on this shop's site, nothing read yet, or not a delivery day: no buttons.
  if (!state || !isPickupDay(state)) return <>{fallback}</>;

  return (
    <PickupButtons
      state={state}
      isStale={isStale}
      busy={busy}
      fallback={fallback}
      onReport={(carrier, action) => void report(carrier, action, user?.email ?? user?.displayName)}
    />
  );
};
