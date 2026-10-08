import type { SiteCarrierDecision } from "../types/order";

/**
 * The site (spider3d-carrier-route.php) decides which courier an order should use and sends it as
 * `order.s3_carrier`. These helpers translate between the site's courier names and our provider ids.
 */
const PROVIDER_BY_SITE_CARRIER: Record<string, string> = {
  zipgo: "zipGo",
  mahirli: "mahirLi",
  negev: "negevExpress",
};

/** Our provider id for a courier name sent by the site; null when unknown or empty. */
export const providerForSiteCarrier = (name?: string | null): string | null =>
  (name && PROVIDER_BY_SITE_CARRIER[name]) || null;

/** The site's courier name for one of our providers; null for a provider the site does not track. */
export const siteCarrierForProvider = (provider: string): string | null => {
  if (provider === "zipGo") return "zipgo";
  if (provider === "mahirLi") return "mahirli";
  if (provider === "negevExpress" || provider === "negevTovala") return "negev";
  return null;
};

/** The provider to preselect: the site's choice when it is connected, otherwise its fallback, otherwise none. */
export const preferredSiteProvider = (
  decision: SiteCarrierDecision | null | undefined,
  connectedProviders: ReadonlySet<string>
): string | null => {
  const first = providerForSiteCarrier(decision?.use);
  if (!first) return null;
  if (connectedProviders.has(first)) return first;
  const second = providerForSiteCarrier(decision?.fallback);
  return second && connectedProviders.has(second) ? second : null;
};

/** Fast or regular according to the site; null when the site made no decision for this order. */
export const siteDeliveryType = (
  decision: SiteCarrierDecision | null | undefined
): "fast" | "regular" | null => {
  if (decision?.use === "zipgo" || decision?.use === "mahirli") return "fast";
  if (decision?.use === "negev") return "regular";
  return null;
};
