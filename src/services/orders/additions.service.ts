import { apiClient } from "../api/client";
import { getApiConfig } from "../api/config";
import type { LinkedAddition } from "../../types/order";

export const parseLinkedAddition = (value: unknown): LinkedAddition | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as LinkedAddition;
  return v.v === 1 && Number.isSafeInteger(v.parent_id) && v.parent_id > 0 &&
    typeof v.parent_number === "string" && typeof v.state === "string" &&
    Number.isSafeInteger(v.amount_minor) && v.amount_minor > 0 &&
    Number.isInteger(v.decimals) && v.decimals >= 0 && v.decimals <= 4 &&
    typeof v.currency === "string" && typeof v.can_decide === "boolean" &&
    (!v.can_decide || v.state === "awaiting_picker") &&
    (v.can_reject === undefined || (typeof v.can_reject === "boolean" &&
      (!v.can_reject || ["awaiting_authorization", "awaiting_picker", "payment_failed"].includes(v.state)))) &&
    v.no_separate_shipping === true && v.cancellation_policy === "manual" ? v : null;
};

export const additionRequest = async (
  orderId: number, decision?: "attach" | "reject", signal?: AbortSignal,
): Promise<LinkedAddition> => {
  if (getApiConfig().platform !== "woo" || !Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new Error("החנות אינה תומכת בבקשת תוספת זו.");
  }
  const data = await apiClient<unknown>({
    method: decision ? "POST" : "GET", path: `/s3-additions/${orderId}`,
    body: decision ? { decision } : undefined, signal, cache: "no-store",
  });
  const result = parseLinkedAddition(data);
  if (!result) throw new Error("לא התקבל מצב מאומת של התוספת. אין לצרף או לחייב שוב.");
  return result;
};
