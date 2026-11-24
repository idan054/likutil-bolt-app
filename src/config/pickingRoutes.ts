import type { UserSettings } from "../types/settings";
import type { PickingRoute } from "../utils/pickingRoute";

// The layout uses relative shelf depths. The three main aisles meet at their front and rear
// crossings. G24 marks the upper G area near Y, and H308 and Y221 are nearby within that area.
const rearDepth = 28;
const abLastPosition = 31;
const cxLastPosition = 27;
const yAccessInG = 24;

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
  layout: {
    station: "front",
    preferredAisle: "A/B",
    walkways: [
      {
        from: "front", to: "rear", length: rearDepth, aisle: "A/B",
        shelves: [{ faces: ["A", "B"], firstPosition: 1, lastPosition: abLastPosition,
          firstDistance: rearDepth / abLastPosition, lastDistance: rearDepth }],
      },
      {
        from: "front", to: "upper-g", length: yAccessInG, aisle: "G",
        shelves: [{ faces: ["G"], firstPosition: 1, lastPosition: yAccessInG - 1,
          firstDistance: 1, lastDistance: yAccessInG - 1 }],
      },
      {
        from: "upper-g", to: "rear", length: rearDepth - yAccessInG, aisle: "G",
        shelves: [{ faces: ["G"], firstPosition: yAccessInG, lastPosition: rearDepth,
          firstDistance: 0, lastDistance: rearDepth - yAccessInG }],
      },
      {
        from: "front", to: "rear", length: rearDepth, aisle: "C/X",
        shelves: [{ faces: ["C", "X"], firstPosition: 1, lastPosition: cxLastPosition,
          firstDistance: rearDepth / cxLastPosition, lastDistance: rearDepth }],
      },
      {
        from: "h-low", to: "upper-g", length: 8, aisle: "H",
        shelves: [{ faces: ["H"], firstPosition: 0, lastPosition: 8, firstDistance: 0, lastDistance: 8 }],
      },
      {
        from: "y-low", to: "upper-g", length: 20, aisle: "Y",
        shelves: [{ faces: ["Y"], firstPosition: 1, lastPosition: 21, firstDistance: 0, lastDistance: 20 }],
      },
      {
        from: "upper-g", to: "y-high", length: 1, aisle: "Y",
        shelves: [{ faces: ["Y"], firstPosition: 22, lastPosition: 22, firstDistance: 1, lastDistance: 1 }],
      },
    ],
  },
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
