interface ShelfRange {
  faces: readonly string[];
  firstPosition: number;
  lastPosition: number;
  firstDistance: number;
  lastDistance: number;
}

interface Walkway {
  from: string;
  to: string;
  length: number;
  aisle?: string;
  shelves?: readonly ShelfRange[];
}

export interface WarehouseLayout {
  station: string;
  preferredAisle?: string;
  walkways: readonly Walkway[];
}

interface NeededShelf {
  face: string;
  position: number;
}

interface LocatedShelf {
  index: number;
  distance: number;
}

interface Move {
  walkway: number;
  from: string;
  turn?: LocatedShelf;
}

const EPSILON = 1e-8;
const SEARCH_LIMIT = 100_000;

const otherEnd = (walkway: Walkway, from: string) => from === walkway.from ? walkway.to : walkway.from;

const locateShelves = (walkways: readonly Walkway[], shelves: readonly NeededShelf[]) => {
  const located = walkways.map((): LocatedShelf[] => []);
  for (const [index, shelf] of shelves.entries()) {
    const matches = walkways.flatMap((walkway, walkwayIndex) => (walkway.shelves ?? [])
      .filter(range => range.faces.includes(shelf.face)
        && shelf.position >= range.firstPosition && shelf.position <= range.lastPosition)
      .map(range => ({ range, walkwayIndex })));
    if (matches.length !== 1) return undefined;

    const { range, walkwayIndex } = matches[0];
    const span = range.lastPosition - range.firstPosition;
    const progress = span ? (shelf.position - range.firstPosition) / span : 0;
    const distance = range.firstDistance + progress * (range.lastDistance - range.firstDistance);
    located[walkwayIndex].push({ index, distance });
  }
  return located.map(stops => stops.sort((a, b) => a.distance - b.distance));
};

const fullCircuit = (layout: WarehouseLayout, adjacent: ReadonlyMap<string, number[]>, crossings: readonly number[]) => {
  const remaining = [...crossings];
  const moves: Move[] = [];
  const visit = (from: string) => {
    for (const walkway of adjacent.get(from) ?? []) {
      while (remaining[walkway] > 0) {
        remaining[walkway]--;
        visit(otherEnd(layout.walkways[walkway], from));
        moves.push({ walkway, from });
      }
    }
  };
  visit(layout.station);
  return remaining.some(Boolean) ? undefined : moves.reverse();
};

const excursions = (walkway: Walkway, stops: readonly LocatedShelf[], reached: ReadonlySet<string>) => {
  let best: { distance: number; near?: LocatedShelf; far?: LocatedShelf } | undefined;
  for (let split = 0; split <= stops.length; split++) {
    const near = stops[split - 1];
    const far = stops[split];
    if ((near && !reached.has(walkway.from)) || (far && !reached.has(walkway.to))) continue;

    const distance = 2 * ((near?.distance ?? 0) + (far ? walkway.length - far.distance : 0));
    if (!best || distance < best.distance) best = { distance, near, far };
  }
  return best;
};

const tracePickingOrder = (
  layout: WarehouseLayout,
  adjacent: ReadonlyMap<string, number[]>,
  circuit: readonly Move[],
  detours: ReadonlyMap<string, Move[]>,
  stops: readonly LocatedShelf[][],
) => {
  const moves: Move[] = [];
  const visited = new Set<string>();
  const addDetours = (node: string) => {
    if (visited.has(node)) return;
    visited.add(node);
    const options = detours.get(node) ?? [];
    moves.push(...options);
  };
  const firstAisle = circuit.find(move => layout.walkways[move.walkway].aisle);
  const startsInPreferredAisle = firstAisle && layout.walkways[firstAisle.walkway].aisle === layout.preferredAisle;
  const hasPreferredDetour = detours.get(layout.station)?.some(move => layout.walkways[move.walkway].aisle === layout.preferredAisle);
  for (const move of circuit) {
    if (move.from !== layout.station || !startsInPreferredAisle || hasPreferredDetour) addDetours(move.from);
    moves.push(move);
  }
  addDetours(layout.station);

  const order = new Set<number>();
  const visitedNodes = new Set<string>();
  const pickAtNode = (node: string) => {
    if (visitedNodes.has(node)) return;
    visitedNodes.add(node);
    for (const index of adjacent.get(node) ?? []) {
      const walkway = layout.walkways[index];
      const distance = node === walkway.from ? 0 : walkway.length;
      for (const stop of stops[index]) {
        if (Math.abs(stop.distance - distance) < EPSILON) order.add(stop.index);
      }
    }
  };
  let entrance: string | undefined;
  for (const move of moves) {
    pickAtNode(move.from);
    const walkway = layout.walkways[move.walkway];
    const ascending = move.from === walkway.from;
    const end = move.turn?.distance ?? (ascending ? walkway.length : 0);
    const start = ascending ? 0 : walkway.length;
    if (!entrance && Math.abs(start - end) > EPSILON) entrance = walkway.aisle;
    const encountered = stops[move.walkway].filter(stop => ascending ? stop.distance <= end + EPSILON : stop.distance >= end - EPSILON);
    const direction = ascending ? 1 : -1;
    encountered.sort((a, b) => direction * (a.distance - b.distance) || a.index - b.index);
    for (const stop of encountered) order.add(stop.index);
  }
  pickAtNode(layout.station);
  return { order: [...order], entrance };
};

export const planWarehouseWalk = (layout: WarehouseLayout, shelves: readonly NeededShelf[]) => {
  if (!shelves.length) return undefined;
  const { walkways } = layout;
  const adjacent = new Map<string, number[]>();
  for (const [index, walkway] of walkways.entries()) {
    if (!walkway.from || !walkway.to || walkway.from === walkway.to || !Number.isFinite(walkway.length) || walkway.length <= 0) {
      return undefined;
    }
    for (const range of walkway.shelves ?? []) {
      if (!walkway.aisle || !Number.isInteger(range.firstPosition) || !Number.isInteger(range.lastPosition)
        || range.firstPosition > range.lastPosition || !Number.isFinite(range.firstDistance) || !Number.isFinite(range.lastDistance)
        || range.firstDistance < 0 || range.lastDistance < range.firstDistance || range.lastDistance > walkway.length
        || (range.firstPosition === range.lastPosition && range.firstDistance !== range.lastDistance)) return undefined;
    }
    for (const node of [walkway.from, walkway.to]) {
      const edges = adjacent.get(node) ?? [];
      edges.push(index);
      adjacent.set(node, edges);
    }
  }
  if (!adjacent.has(layout.station)) return undefined;
  const stops = locateShelves(walkways, shelves);
  if (!stops) return undefined;

  let best: (ReturnType<typeof tracePickingOrder> & { distance: number }) | undefined;
  let examined = 0;
  const crossings = walkways.map(() => 0);
  const odd = new Set<string>();
  const flip = (node: string) => { if (!odd.delete(node)) odd.add(node); };

  const consider = (fullDistance: number) => {
    const circuit = fullCircuit(layout, adjacent, crossings);
    if (!circuit) return;
    const reached = new Set([layout.station, ...circuit.map(move => move.from)]);
    const detours = new Map<string, Move[]>();
    let distance = fullDistance;
    const addDetour = (walkway: number, from: string, turn?: LocatedShelf) => {
      if (!turn) return;
      const list = detours.get(from) ?? [];
      const move = { walkway, from, turn };
      if (walkways[walkway].aisle === layout.preferredAisle) list.unshift(move);
      else list.push(move);
      detours.set(from, list);
    };
    for (const [index, walkway] of walkways.entries()) {
      if (crossings[index] || !stops[index].length) continue;
      const visit = excursions(walkway, stops[index], reached);
      if (!visit) return;
      distance += visit.distance;
      if (best && distance > best.distance + EPSILON) return;
      addDetour(index, walkway.from, visit.near);
      addDetour(index, walkway.to, visit.far);
    }

    const reverse = [...circuit].reverse().map(move => ({ ...move, from: otherEnd(walkways[move.walkway], move.from) }));
    for (const path of [circuit, reverse]) {
      const route = tracePickingOrder(layout, adjacent, path, detours, stops);
      if (route.order.length !== shelves.length) continue;
      const prefersRoute = layout.preferredAisle && route.entrance === layout.preferredAisle
        && best?.entrance !== layout.preferredAisle;
      if (!best || distance < best.distance - EPSILON || prefersRoute) best = { ...route, distance };
    }
  };

  // A shortest closed walk uses a link at most twice. Full crossings have even degree at every
  // junction. A segment left uncrossed is served by a return trip from one or both reachable ends.
  const search = (index: number, distance: number) => {
    if (++examined > SEARCH_LIMIT || (best && distance > best.distance + EPSILON)) return;
    if (index === walkways.length) {
      consider(distance);
      return;
    }

    const { from, to, length } = walkways[index];
    const fromEdges = adjacent.get(from)!;
    const toEdges = adjacent.get(to)!;
    const lastAtFrom = fromEdges[fromEdges.length - 1] === index;
    const lastAtTo = toEdges[toEdges.length - 1] === index;
    for (let count = 0; count <= 2; count++) {
      crossings[index] = count;
      if (count === 1) { flip(from); flip(to); }
      if (!(lastAtFrom && odd.has(from)) && !(lastAtTo && odd.has(to))) {
        search(index + 1, distance + count * length);
      }
      if (count === 1) { flip(from); flip(to); }
    }
  };

  search(0, 0);
  return examined <= SEARCH_LIMIT ? best : undefined;
};
