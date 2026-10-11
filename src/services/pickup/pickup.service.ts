import { apiClient } from "../api/client";
import { ApiError } from "../api/types";
import { isPickupState, type PickupCarrier, type PickupState } from "../../utils/pickupSignal";

const PICKUP_PATH = "/s3/pickup";

const readState = (response: unknown): PickupState => {
  if (!isPickupState(response)) throw new Error("מצב האיסוף שהתקבל מהחנות אינו תקין.");
  return response;
};

export const getPickupState = async (signal?: AbortSignal): Promise<PickupState> =>
  readState(await apiClient<unknown>({ method: "GET", path: PICKUP_PATH, signal, cache: "no-store" }));

export const sendPickup = async (
  carrier: PickupCarrier | "all",
  action: "close" | "reopen",
  by?: string | null
): Promise<PickupState> =>
  readState(await apiClient<unknown>({
    method: "POST",
    path: PICKUP_PATH,
    body: { carrier, action, ...(by ? { by: by.slice(0, 60) } : {}) },
  }));

/** The main switch: on, the site and the systems around it follow the buttons; off, the presses are only kept. */
export const setPickupSwitch = async (on: boolean, by?: string | null): Promise<PickupState> =>
  readState(await apiClient<unknown>({
    method: "POST",
    path: PICKUP_PATH,
    body: { action: "switch", on, ...(by ? { by: by.slice(0, 60) } : {}) },
  }));

/** A site that has the pickup route but not the switch yet answers a switch request as a bad request. */
export const isPickupSwitchUnsupported = (error: unknown) =>
  error instanceof ApiError && error.details.responseStatus === 400;

/** A shop whose site has no pickup route: the buttons are simply not part of that shop. */
export const isPickupRouteMissing = (error: unknown) =>
  error instanceof ApiError && error.details.responseStatus === 404;
