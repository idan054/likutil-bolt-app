import type { DeliveryTaskResponse } from "../services/delivery/types";

type LabelCarrier = "negev" | "mahirli";

export const getLabelCarrier = (provider: string): LabelCarrier | null => {
  if (provider === "negevExpress") return "negev";
  if (provider === "mahirLi") return "mahirli";
  return null;
};

const getBaseUrl = (value: unknown, orderId: number): URL | null => {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.searchParams.get("action") === "s3_label" &&
      url.searchParams.get("o") === String(orderId) &&
      Boolean(url.searchParams.get("t"))
      ? url
      : null;
  } catch {
    return null;
  }
};

const positiveNumber = (value: unknown): string | null => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return /^\d+$/.test(text) && /[1-9]/.test(text) ? text : null;
};

export const getShipmentNumber = (
  provider: string,
  response: DeliveryTaskResponse
): string | null => {
  const carrier = getLabelCarrier(provider);
  if (carrier === "negev") {
    return positiveNumber(response.DeliveryNumber) ??
      positiveNumber(response.track_number);
  }
  if (carrier === "mahirli") {
    return positiveNumber(response.task_id) ??
      positiveNumber(response.id) ??
      positiveNumber(response.track_number);
  }
  return null;
};

export const getShipmentLabelUrl = (
  labelUrl: unknown,
  orderId: number,
  provider: string,
  response: DeliveryTaskResponse,
  packageCount: string,
  sentCity?: string
): string | null => {
  const url = getBaseUrl(labelUrl, orderId);
  const carrier = getLabelCarrier(provider);
  const shipmentNumber = getShipmentNumber(provider, response);
  if (!url || !carrier || !shipmentNumber) return null;

  url.searchParams.set("c", carrier);
  url.searchParams.set("d", shipmentNumber);
  url.searchParams.delete("n");
  url.searchParams.delete("city");
  if (carrier === "negev") {
    const count = Number(packageCount);
    if (!Number.isInteger(count) || count < 1 || count > 20) return null;
    if (count > 1) url.searchParams.set("n", String(count));
    if (sentCity) url.searchParams.set("city", sentCity);
  }
  return url.toString();
};

export const getReprintLabelUrl = (
  labelUrl: unknown,
  orderId: number,
  provider: string,
  sentCity?: string
): string | null => {
  const url = getBaseUrl(labelUrl, orderId);
  const carrier = getLabelCarrier(provider);
  if (!url || !carrier) return null;
  url.searchParams.set("c", carrier);
  url.searchParams.delete("d");
  url.searchParams.delete("n");
  url.searchParams.delete("city");
  if (carrier === "negev" && sentCity) url.searchParams.set("city", sentCity);
  return url.toString();
};
