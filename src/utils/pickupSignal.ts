import { siteCarrierForProvider } from "./siteCarrier";

/**
 * "The courier collected": the picker reports that a courier company took today's parcels, and the shop
 * site (spider3d-pickup-signal.php, `wc/v3/s3/pickup`) stops promising "today" for that company.
 * These helpers hold the rules of the buttons; they read and decide nothing about delivery types.
 */
export const PICKUP_CARRIERS = ["mahirli", "zipgo", "negev"] as const;
export type PickupCarrier = (typeof PICKUP_CARRIERS)[number];

export interface PickupCarrierState {
  closed: boolean;
  closed_at: string | null;
  by: string | null;
  open_today: boolean;
}

export interface PickupState {
  v: number;
  on: boolean;
  day: string;
  now: string;
  delivery_day: boolean;
  promise_hour: number;
  remind_from: string;
  ceiling_hour: number;
  carriers: Partial<Record<PickupCarrier, PickupCarrierState>>;
}

const CARRIER_NAMES: Record<PickupCarrier, string> = {
  mahirli: "מהיר לי",
  zipgo: "ZIPGO",
  negev: "נגב",
};

const SAME_DAY_CARRIERS: ReadonlySet<PickupCarrier> = new Set(["mahirli", "zipgo"]);

export const pickupCarrierName = (carrier: PickupCarrier) => CARRIER_NAMES[carrier];

export const isPickupState = (value: unknown): value is PickupState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PickupState>;
  return typeof state.delivery_day === "boolean" && typeof state.now === "string" &&
    Boolean(state.carriers) && typeof state.carriers === "object" && !Array.isArray(state.carriers);
};

/** The site's courier names for the providers this account is connected to, in a fixed order. */
export const pickupCarriersFor = (connectedProviders: Iterable<string>): PickupCarrier[] => {
  const found = new Set<string>();
  for (const provider of connectedProviders) {
    const carrier = siteCarrierForProvider(provider);
    if (carrier) found.add(carrier);
  }
  return PICKUP_CARRIERS.filter((carrier) => found.has(carrier));
};

/** "12:05" out of the site's own timestamp; the site's clock, not the browser's. */
export const pickupClock = (timestamp: string | null | undefined) =>
  /T(\d{2}:\d{2})/.exec(timestamp || "")?.[1] ?? "";

export const pickupButtonLabel = (carrier: PickupCarrier, state: PickupCarrierState | undefined) => {
  const name = CARRIER_NAMES[carrier];
  if (!state?.closed) return `${name} אסף`;
  const clock = pickupClock(state.closed_at);
  return clock ? `${name} נאסף ${clock}` : `${name} נאסף`;
};

/** The buttons work on delivery days only; on any other day nothing is shown and nothing is sent. */
export const isPickupDay = (state: PickupState | null | undefined) => Boolean(state?.delivery_day);

/** A same-day courier that was not reported yet blinks from the reminder hour, while the site still offers "today". */
export const shouldRemindPickup = (state: PickupState, carrier: PickupCarrier) => {
  const carrierState = state.carriers[carrier];
  if (!state.delivery_day || !SAME_DAY_CARRIERS.has(carrier) || !carrierState) return false;
  if (carrierState.closed || !carrierState.open_today) return false;
  const clock = pickupClock(state.now);
  return Boolean(clock && /^\d{2}:\d{2}$/.test(state.remind_from) && clock >= state.remind_from);
};

export const allPickupClosed = (state: PickupState, carriers: PickupCarrier[]) =>
  carriers.length > 0 && carriers.every((carrier) => Boolean(state.carriers[carrier]?.closed));
