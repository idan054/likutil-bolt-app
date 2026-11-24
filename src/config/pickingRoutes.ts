import type { UserSettings } from "../types/settings";
import type { PickingRoute } from "../utils/pickingRoute";

const spider3dRoute: PickingRoute = {
  skuSeparator: /[\s/,+-]+/,
  locationPattern: /^(?<code>(?<face>[A-Z]?)(?<level>[1-9])(?<position>\d{2}))\.?$/i,
  // Opposing faces share the same position numbers in a segment.
  segments: [
    { faces: ["G"] },
    { faces: ["A", "B"], descending: true },
    { faces: ["C", "X"] },
    { faces: ["H"] },
    { faces: ["Y"], overflow: true },
  ],
};

const routesByStore = new Map<string, PickingRoute>([
  ["woo:spider3d.co.il", spider3dRoute],
  ["woo:www.spider3d.co.il", spider3dRoute],
]);

export const getPickingRoute = (settings?: Pick<UserSettings, "authType" | "storeUrl"> | null) => {
  if (!settings?.authType || typeof settings.storeUrl !== "string") return undefined;

  const store = settings.storeUrl.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return routesByStore.get(`${settings.authType.toLowerCase()}:${store}`);
};
