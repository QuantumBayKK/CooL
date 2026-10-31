/**
 * The headquarters map: nine districts in a 3 x 3 grid around the lobby, built from code so it is
 * deterministic, testable and easy to change. 16 px tiles, 4-direction grid movement.
 *
 *   The Commons  | Meeting hall | Assembly hall
 *   Projects     | Lobby        | Showcase
 *   Quiet work   | Help desk    | Event space
 */
import { ROOMS } from "./world";

export const TILE = 16;
const ROOM_W = 14, ROOM_H = 9;
export const MAP_W = ROOM_W * 3 + 4; // 46
export const MAP_H = ROOM_H * 3 + 4; // 31

export type Floor = "void" | "wall" | "wood" | "tile" | "carpet" | "slate" | "gallery" | "moss" | "stage";
export type Kind =
  | "desk" | "chair" | "plant" | "shelf" | "sofa" | "board" | "kiosk" | "table" | "counter" | "frame"
  | "lamp" | "rug" | "screen" | "podium" | "bench" | "coffee" | "cabinet" | "portal" | "sign" | "elevator";

export type Piece = { kind: Kind; x: number; y: number; w: number; h: number; solid: boolean; interact?: string; label?: string };
export type District = { id: string; col: number; row: number; floor: Floor; x0: number; y0: number };

/** Footprint of each piece kind in tiles, and whether you can walk through it. */
export const SIZE: Record<Kind, { w: number; h: number; solid: boolean }> = {
  desk: { w: 2, h: 1, solid: true }, chair: { w: 1, h: 1, solid: false }, plant: { w: 1, h: 1, solid: true },
  shelf: { w: 2, h: 1, solid: true }, sofa: { w: 3, h: 1, solid: true }, board: { w: 3, h: 1, solid: true },
  kiosk: { w: 1, h: 1, solid: true }, table: { w: 3, h: 2, solid: true }, counter: { w: 4, h: 1, solid: true },
  frame: { w: 2, h: 1, solid: true }, lamp: { w: 1, h: 1, solid: true }, rug: { w: 4, h: 3, solid: false },
  screen: { w: 4, h: 1, solid: true }, podium: { w: 1, h: 1, solid: true }, bench: { w: 3, h: 1, solid: true },
  coffee: { w: 1, h: 1, solid: true }, cabinet: { w: 1, h: 1, solid: true }, portal: { w: 2, h: 1, solid: true },
  sign: { w: 2, h: 1, solid: true }, elevator: { w: 2, h: 1, solid: true },
};

const LAYOUT: { id: string; col: number; row: number; floor: Floor }[] = [
  { id: "hq.commons", col: 0, row: 0, floor: "carpet" },
  { id: "hq.meeting", col: 1, row: 0, floor: "slate" },
  { id: "hq.assembly", col: 2, row: 0, floor: "wood" },
  { id: "hq.projects", col: 0, row: 1, floor: "wood" },
  { id: "hq.lobby", col: 1, row: 1, floor: "tile" },
  { id: "hq.showcase", col: 2, row: 1, floor: "gallery" },
  { id: "hq.quiet", col: 0, row: 2, floor: "moss" },
  { id: "hq.help", col: 1, row: 2, floor: "tile" },
  { id: "hq.events", col: 2, row: 2, floor: "wood" },
];

export const DISTRICTS: District[] = LAYOUT.map((d) => ({ ...d, x0: 1 + d.col * (ROOM_W + 1), y0: 1 + d.row * (ROOM_H + 1) }));

/** Furniture, in room-local coordinates (0..13 by 0..8). Row 0 sits against the back wall. */
const FURNITURE: Record<string, [Kind, number, number, string?][]> = {
  "hq.commons": [["board", 1, 0, "commons.ideas"], ["board", 6, 0], ["kiosk", 11, 0, "commons.hub"], ["kiosk", 12, 0, "commons.hub"],
    ["rug", 5, 3], ["sofa", 1, 6], ["plant", 0, 8], ["plant", 13, 8], ["bench", 9, 6], ["lamp", 13, 0]],
  "hq.meeting": [["screen", 5, 0, "meeting.terminal"], ["table", 5, 3], ["chair", 4, 3], ["chair", 4, 4], ["chair", 8, 3], ["chair", 8, 4],
    ["chair", 6, 5], ["plant", 0, 0], ["plant", 13, 0], ["cabinet", 0, 8], ["coffee", 13, 8]],
  "hq.assembly": [["podium", 6, 1, "assembly.polls"], ["screen", 4, 0], ["bench", 2, 4], ["bench", 9, 4], ["bench", 2, 6], ["bench", 9, 6],
    ["plant", 0, 0], ["plant", 13, 0], ["lamp", 0, 8], ["lamp", 13, 8]],
  "hq.projects": [["portal", 1, 0, "projects.cool"], ["sign", 6, 0, "projects.directory"], ["shelf", 11, 0],
    ["desk", 1, 3], ["chair", 1, 4], ["desk", 5, 3], ["chair", 5, 4], ["desk", 9, 3], ["chair", 9, 4],
    ["desk", 1, 6], ["chair", 1, 7], ["desk", 5, 6], ["chair", 5, 7], ["plant", 13, 8]],
  "hq.lobby": [["board", 1, 0, "lobby.directory"], ["elevator", 5, 0, "elevator"], ["frame", 9, 0, "lobby.people"], ["shelf", 12, 0], ["rug", 5, 3],
    ["plant", 0, 8], ["plant", 13, 8], ["sofa", 1, 5], ["lamp", 13, 3]],
  "hq.showcase": [["frame", 1, 0, "showcase.wall"], ["frame", 4, 0], ["frame", 7, 0], ["frame", 10, 0],
    ["podium", 3, 4], ["podium", 7, 4], ["podium", 10, 4], ["bench", 5, 7], ["plant", 0, 8], ["plant", 13, 8]],
  "hq.quiet": [["desk", 1, 1, "desk:q1"], ["chair", 1, 2], ["desk", 5, 1, "desk:q2"], ["chair", 5, 2], ["desk", 9, 1, "desk:q3"], ["chair", 9, 2],
    ["desk", 1, 5, "desk:q4"], ["chair", 1, 6], ["desk", 5, 5, "desk:q5"], ["chair", 5, 6], ["shelf", 11, 7, "quiet.desk"], ["plant", 13, 0], ["lamp", 9, 5]],
  "hq.help": [["counter", 5, 2, "help.guidelines"], ["kiosk", 1, 0, "help.privacy"], ["kiosk", 12, 0, "help.profile"],
    ["plant", 0, 8], ["plant", 13, 8], ["bench", 1, 6], ["bench", 10, 6], ["sign", 6, 0]],
  "hq.events": [["screen", 5, 0, "events.calendar"], ["podium", 6, 1], ["bench", 2, 4], ["bench", 9, 4], ["bench", 2, 6], ["bench", 9, 6],
    ["coffee", 0, 8], ["plant", 13, 8], ["lamp", 0, 0], ["lamp", 13, 0]],
};

export type WorldMap = {
  floor: Floor[][];
  solid: boolean[][];
  pieces: Piece[];
  spawn: { x: number; y: number };
  districtAt: (x: number, y: number) => District | null;
};

/** Builds the whole map. Pure and deterministic. */
export function buildWorld(): WorldMap {
  const floor: Floor[][] = Array.from({ length: MAP_H }, () => Array<Floor>(MAP_W).fill("void"));
  for (const d of DISTRICTS) {
    for (let y = d.y0 - 1; y <= d.y0 + ROOM_H; y++) for (let x = d.x0 - 1; x <= d.x0 + ROOM_W; x++) floor[y]![x] = "wall";
  }
  for (const d of DISTRICTS) {
    for (let y = d.y0; y < d.y0 + ROOM_H; y++) for (let x = d.x0; x < d.x0 + ROOM_W; x++) floor[y]![x] = d.floor;
  }
  // Doors: two tiles wide, between every pair of neighbouring districts, plus the front entrance.
  const midY = (row: number) => 1 + row * (ROOM_H + 1) + Math.floor(ROOM_H / 2);
  const midX = (col: number) => 1 + col * (ROOM_W + 1) + Math.floor(ROOM_W / 2) - 1;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
    const x = (col + 1) * (ROOM_W + 1);
    floor[midY(row)]![x] = "tile";
    floor[midY(row) + 1]![x] = "tile";
  }
  for (let col = 0; col < 3; col++) for (let row = 0; row < 2; row++) {
    const y = (row + 1) * (ROOM_H + 1);
    floor[y]![midX(col)] = "tile";
    floor[y]![midX(col) + 1] = "tile";
  }

  const pieces: Piece[] = [];
  for (const d of DISTRICTS) {
    for (const [kind, rx, ry, interact] of FURNITURE[d.id] ?? []) {
      const s = SIZE[kind];
      const label = interact === "elevator" ? "Elevator" : interact?.startsWith("desk:") ? "Desk" : interact ? ROOMS.flatMap((r) => r.interactables).find((i) => i.id === interact)?.label : undefined;
      pieces.push({ kind, x: d.x0 + rx, y: d.y0 + ry, w: s.w, h: s.h, solid: s.solid, interact, label });
    }
  }
  const solid = floor.map((row) => row.map((f) => f === "void" || f === "wall"));
  for (const p of pieces) if (p.solid) for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) solid[y]![x] = true;

  const lobby = DISTRICTS.find((d) => d.id === "hq.lobby")!;
  const spawn = { x: lobby.x0 + 7, y: lobby.y0 + 6 };
  const districtAt = (x: number, y: number) =>
    DISTRICTS.find((d) => x >= d.x0 && x < d.x0 + ROOM_W && y >= d.y0 && y < d.y0 + ROOM_H) ?? null;
  return { floor, solid, pieces, spawn, districtAt };
}

export function walkable(m: WorldMap, x: number, y: number) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && !m.solid[y]![x];
}

/** Shortest 4-direction path from a to b (excluding a), or null. Breadth-first; the map is small. */
export function findPath(m: WorldMap, ax: number, ay: number, bx: number, by: number): { x: number; y: number }[] | null {
  if (!walkable(m, bx, by)) return null;
  const prev = new Int32Array(MAP_W * MAP_H).fill(-1);
  const start = ay * MAP_W + ax, goal = by * MAP_W + bx;
  const queue = [start];
  prev[start] = start;
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]!;
    if (cur === goal) break;
    const cx = cur % MAP_W, cy = (cur - cx) / MAP_W;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
      const nx = cx + dx, ny = cy + dy, n = ny * MAP_W + nx;
      if (walkable(m, nx, ny) && prev[n] === -1) { prev[n] = cur; queue.push(n); }
    }
  }
  if (prev[goal] === -1) return null;
  const path: { x: number; y: number }[] = [];
  for (let c = goal; c !== start; c = prev[c]!) path.push({ x: c % MAP_W, y: Math.floor(c / MAP_W) });
  return path.reverse();
}

/** The interactable piece within reach of (x, y): adjacent to, or standing on, its footprint. */
export function reachable(m: WorldMap, x: number, y: number): Piece | null {
  let best: Piece | null = null, bestD = Infinity;
  for (const p of m.pieces) {
    if (!p.interact) continue;
    const dx = Math.max(p.x - x, 0, x - (p.x + p.w - 1)), dy = Math.max(p.y - y, 0, y - (p.y + p.h - 1));
    const d = dx + dy;
    if (d <= 1 && d < bestD) { best = p; bestD = d; }
  }
  return best;
}

/** Where the team sits: the chairs at the two front desks of the Projects room, facing their screens. */
export function teamSeat(seat: number): { x: number; y: number } | null {
  const d = DISTRICTS.find((x) => x.id === "hq.projects")!;
  const seats: Record<number, { x: number; y: number }> = { 1: { x: d.x0 + 1, y: d.y0 + 4 }, 2: { x: d.x0 + 5, y: d.y0 + 4 } };
  return seats[seat] ?? null;
}
