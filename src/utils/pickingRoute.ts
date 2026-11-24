import type { LineItem } from "../types/order";

export interface PickingRoute {
  segments: readonly {
    faces: readonly string[];
    descending?: boolean;
    overflow?: boolean;
  }[];
  skuSeparator: RegExp;
  locationPattern: RegExp;
}

export interface PickingLocation {
  primary: string;
  alternatives: string[];
  overflow: string[];
}

interface Shelf {
  code: string;
  face: string;
  level: number;
  position: number;
  segment: number;
  faceOrder: number;
  overflow: boolean;
}

const pickingLocationForSku = (sku: string, route: PickingRoute) => {
  if (typeof sku !== "string" || !sku.trim()) return undefined;

  const shelves: Shelf[] = [];
  const tokens = sku.trim().split(route.skuSeparator).filter(Boolean);
  for (const token of tokens) {
    const parts = route.locationPattern.exec(token)?.groups;
    if (!parts?.code) return undefined;

    const level = Number(parts.level);
    const position = Number(parts.position);
    const previous = shelves[shelves.length - 1];
    const face = parts.face?.toUpperCase() || previous?.face;
    if (!face || !Number.isSafeInteger(level) || !Number.isSafeInteger(position)) return undefined;

    // An abbreviated code can only refer to another level of the preceding stop.
    if (!parts.face && previous?.position !== position) return undefined;

    const segment = route.segments.findIndex(({ faces }) => faces.includes(face));
    if (segment === -1) return undefined;

    shelves.push({
      code: parts.face ? parts.code.toUpperCase() : `${face}${parts.code}`,
      face,
      level,
      position,
      segment,
      faceOrder: route.segments[segment].faces.indexOf(face),
      overflow: route.segments[segment].overflow === true,
    });
  }

  const regular = shelves.filter(shelf => !shelf.overflow);
  const [first, ...otherCandidates] = regular.length ? regular : shelves;
  if (!first || otherCandidates.some(shelf => shelf.face !== first.face || shelf.position !== first.position)) {
    return undefined;
  }

  const primary = otherCandidates.reduce((lowest, shelf) => shelf.level < lowest.level ? shelf : lowest, first);
  const alternatives = new Set<string>();
  const overflow = new Set<string>();
  for (const shelf of shelves) {
    if (shelf.code === primary.code) continue;
    (shelf.overflow ? overflow : alternatives).add(shelf.code);
  }

  const location: PickingLocation = {
    primary: primary.code,
    alternatives: [...alternatives],
    overflow: [...overflow],
  };
  return { primary, location };
};

export const orderItemsForPicking = (items: readonly LineItem[], route: PickingRoute) => {
  const rows = items.map(item => ({ item, picking: pickingLocationForSku(item.sku, route) }));
  rows.sort((a, b) => {
    const first = a.picking?.primary;
    const second = b.picking?.primary;
    if (!first || !second) return Number(Boolean(second)) - Number(Boolean(first));

    const direction = route.segments[first.segment].descending ? -1 : 1;
    return first.segment - second.segment
      || direction * (first.position - second.position)
      || first.faceOrder - second.faceOrder
      || first.level - second.level;
  });

  return rows.map(({ item, picking }) => ({ item, location: picking?.location }));
};
