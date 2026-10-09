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

/** `rulesUpdatedAt` of a saved delivery decision that was taken from the site's routing decision. */
export const SITE_DECISION_MARK = "site-carrier";

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

/**
 * Providers whose card must not be clickable for this order, with the reason to show on the card:
 * the couriers the site says do not reach the order's town. Keyed by our provider id.
 */
export const siteBlockedProviders = (
  decision: SiteCarrierDecision | null | undefined
): Record<string, string> => {
  const blocked = decision?.blocked;
  if (!blocked || Array.isArray(blocked) || typeof blocked !== "object") return {};
  const out: Record<string, string> = {};
  for (const [name, reason] of Object.entries(blocked)) {
    const provider = providerForSiteCarrier(name);
    // Negev delivers everywhere and is the fallback of every order: it is never blocked.
    if (provider && provider !== "negevExpress" && typeof reason === "string" && reason) out[provider] = reason;
  }
  return out;
};

/** Fast or regular according to the site; null when the site made no decision for this order. */
export const siteDeliveryType = (
  decision: SiteCarrierDecision | null | undefined
): "fast" | "regular" | null => {
  if (decision?.use === "zipgo" || decision?.use === "mahirli") return "fast";
  // An order the customer paid same-day for stays a same-day order, even when the site found no same-day courier for it.
  if (decision?.use === "negev") return decision.service === "sameday" ? "fast" : "regular";
  return null;
};
