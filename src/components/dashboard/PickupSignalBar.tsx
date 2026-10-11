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
}

const BUTTON_BASE =
  "flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const PickupButtons: React.FC<PickupButtonsProps> = ({ state, isStale, busy, onReport }) => {
  const { integrations } = useDeliveryIntegrations();
  const carriers = useMemo(
    () => pickupCarriersFor(integrations.filter(({ isConnected }) => isConnected).map(({ provider }) => provider)),
    [integrations]
  );
  if (carriers.length === 0) return null;

  const allClosed = allPickupClosed(state, carriers);

  const handleCarrier = (carrier: PickupCarrier) => {
    if (!state.carriers[carrier]?.closed) return onReport(carrier, "close");
    if (window.confirm(`לפתוח מחדש את ${pickupCarrierName(carrier)} להיום?`)) onReport(carrier, "reopen");
  };

  const handleAll = () => {
    if (window.confirm("לסמן שכל חברות המשלוחים אספו להיום?")) onReport("all", "close");
  };

  return (
    <div className="mt-4 border-t border-blue-100 pt-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="flex items-center gap-2 text-sm text-blue-900">
          <Truck size={18} />
          איסוף שליחים
        </span>
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
                  ? "border-green-300 bg-green-100 text-green-800 hover:bg-green-200"
                  : `border-blue-200 bg-white text-blue-700 hover:bg-blue-100 ${
                      remind ? "animate-pulse ring-2 ring-amber-400" : ""
                    }`
              }`}
            >
              {closed && <Check size={16} />}
              <span>{pickupButtonLabel(carrier, carrierState)}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleAll}
          disabled={busy !== null || allClosed}
          className={`${BUTTON_BASE} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`}
        >
          {allClosed ? "נסגר להיום" : "סיימתי להיום"}
        </button>
        {isStale && (
          <span role="status" className="text-sm text-amber-800">
            מצב האיסוף לא התעדכן. מוצג המצב האחרון שנקרא.
          </span>
        )}
      </div>
    </div>
  );
};

/** The row of "the courier collected" buttons inside the blue picking bar. */
export const PickupSignalBar: React.FC = () => {
  const [user] = useAuthState(auth);
  const isWoo = settingsStorage.get()?.authType !== "shopify";
  const { state, isStale, busy, report } = usePickupSignal(isWoo);

  // No route on this shop's site, nothing read yet, or not a delivery day: no buttons.
  if (!state || !isPickupDay(state)) return null;

  return (
    <PickupButtons
      state={state}
      isStale={isStale}
      busy={busy}
      onReport={(carrier, action) => void report(carrier, action, user?.email ?? user?.displayName)}
    />
  );
};
