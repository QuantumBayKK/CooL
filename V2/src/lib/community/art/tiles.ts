/**
 * Original world art, drawn pixel by pixel in code. No image files and no third-party tiles.
 *
 * Art bible (keep new art consistent with this):
 * - 16 px tiles, shown at whole-number scales only. Light comes from the top left.
 * - Night outside (near-black, matching the site), warm light inside.
 * - Every object has a 1 px dark outline (OUT), a lighter top face and a darker front face.
 * - Objects stand on their footprint; the part drawn above it (UP) gives the 2.5D height.
 * - Glowing things (screens, lamps, kiosks) use the accent colours GLOW and WARM.
 */
import type { Floor, Kind } from "../world-map";

export const T = 16;
type Ctx = CanvasRenderingContext2D;

const OUT = "#14161b";
const GLOW = "#8fd8ff";
const WARM = "#ffd89a";

/** How far above its footprint each kind of object is drawn, in pixels. */
export const UP: Record<Kind, number> = {
  desk: 12, chair: 6, plant: 10, shelf: 22, sofa: 8, board: 20, kiosk: 16, table: 4, counter: 8, frame: 20,
  lamp: 22, rug: 0, screen: 22, podium: 10, bench: 4, coffee: 10, cabinet: 10, portal: 26, sign: 18, elevator: 26,
};

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}
const fill = (g: Ctx, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const px = (g: Ctx, x: number, y: number, c: string) => fill(g, x, y, 1, 1, c);
/** A box with outline, lighter top band and darker bottom band. */
function box(g: Ctx, x: number, y: number, w: number, h: number, base: string, top: string, side: string) {
  fill(g, x, y, w, h, OUT);
  fill(g, x + 1, y + 1, w - 2, h - 2, base);
  fill(g, x + 1, y + 1, w - 2, 2, top);
  fill(g, x + 1, y + h - 3, w - 2, 2, side);
}
/** Deterministic noise so the same tile always looks the same. */
function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000) / 1000; };
}

// ── floors ───────────────────────────────────────────────────────────────────
const FLOORS: Record<Exclude<Floor, "void" | "wall">, (g: Ctx, x: number, y: number, tx: number, ty: number) => void> = {
  wood(g, x, y, tx, ty) {
    const planks = ["#6b4a33", "#62442f", "#734f37"];
    for (let r = 0; r < 4; r++) {
      const c = planks[(tx * 3 + ty * 5 + r) % 3]!;
      fill(g, x, y + r * 4, T, 4, c);
      fill(g, x, y + r * 4 + 3, T, 1, "#4a3323");
      px(g, x + ((tx * 7 + r * 5 + ty * 3) % 14) + 1, y + r * 4, "#3e2a1e");
    }
    const n = rand(tx * 92821 + ty * 68917);
    for (let i = 0; i < 3; i++) px(g, x + Math.floor(n() * T), y + Math.floor(n() * T), "#7d5a40");
  },
  tile(g, x, y, tx, ty) {
    fill(g, x, y, T, T, (tx + ty) % 2 ? "#c9c4b8" : "#bfb9ac");
    fill(g, x, y, T, 1, "#a39d90");
    fill(g, x, y, 1, T, "#a39d90");
    px(g, x + 3, y + 3, "#d6d1c6");
  },
  carpet(g, x, y, tx, ty) {
    fill(g, x, y, T, T, "#2f5d5a");
    const n = rand(tx * 31 + ty * 977);
    for (let i = 0; i < 10; i++) px(g, x + Math.floor(n() * T), y + Math.floor(n() * T), n() > 0.5 ? "#376a66" : "#2a5451");
  },
  slate(g, x, y, tx, ty) {
    fill(g, x, y, T, T, (tx + ty) % 2 ? "#4a5260" : "#454c59");
    fill(g, x, y + T - 1, T, 1, "#3a404b");
    fill(g, x + T - 1, y, 1, T, "#3a404b");
  },
  gallery(g, x, y, tx, ty) {
    fill(g, x, y, T, T, "#23262d");
    if ((tx + ty) % 3 === 0) fill(g, x + 2, y + 2, 5, 1, "#2e323b");
    fill(g, x, y, T, 1, "#1b1e24");
  },
  moss(g, x, y, tx, ty) {
    fill(g, x, y, T, T, "#3f5a45");
    const n = rand(tx * 131 + ty * 7919);
    for (let i = 0; i < 8; i++) px(g, x + Math.floor(n() * T), y + Math.floor(n() * T), n() > 0.5 ? "#476550" : "#38503d");
  },
  stage(g, x, y) {
    fill(g, x, y, T, T, "#4e3727");
    fill(g, x, y + 7, T, 1, "#3a2819");
    fill(g, x, y + 15, T, 1, "#3a2819");
  },
};

/** Paints the whole floor and wall layer once. Wall tiles above a floor show their front face. */
export function paintGround(floor: Floor[][]): HTMLCanvasElement {
  const h = floor.length, w = floor[0]!.length;
  const [c, g] = canvas(w * T, h * T);
  fill(g, 0, 0, w * T, h * T, "#050608");
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const f = floor[ty]![tx]!, x = tx * T, y = ty * T;
    if (f === "void") continue;
    if (f !== "wall") { FLOORS[f](g, x, y, tx, ty); continue; }
    const below = floor[ty + 1]?.[tx];
    const face = below !== undefined && below !== "wall" && below !== "void";
    if (face) {
      // front face of a wall: cap, plaster, a window every few tiles, baseboard
      fill(g, x, y, T, 4, "#3d4352");
      fill(g, x, y + 3, T, 1, "#4a5163");
      fill(g, x, y + 4, T, 10, "#2b2f3a");
      fill(g, x, y + 14, T, 2, "#1d2028");
      if (tx % 5 === 2) {
        fill(g, x + 3, y + 5, 10, 7, OUT);
        fill(g, x + 4, y + 6, 8, 5, "#1b2a44");
        px(g, x + 6, y + 7, "#9fb4d9");
        px(g, x + 10, y + 9, "#6f86ad");
        fill(g, x + 8, y + 6, 1, 5, OUT);
      }
    } else {
      fill(g, x, y, T, T, "#3d4352");
      fill(g, x + 1, y + 1, T - 2, T - 2, "#353a47");
    }
  }
  // soft shadow under every front wall face
  for (let ty = 1; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    if (floor[ty - 1]![tx] === "wall" && floor[ty]![tx] !== "wall" && floor[ty]![tx] !== "void") {
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.fillRect(tx * T, ty * T, T, 3);
    }
  }
  return c;
}

// ── objects ──────────────────────────────────────────────────────────────────
type Painter = (g: Ctx, w: number, h: number, up: number) => void;

const NOTE = ["#f2d16b", "#8fd3c7", "#f29e8e", "#c7b6f2", "#a8d68f"];

const PAINT: Record<Kind, Painter> = {
  desk(g, w, h, up) {
    box(g, 0, up - 2, w, h + 2, "#8a6446", "#a47a57", "#5e412d");
    fill(g, 2, up + h - 4, 2, 4, OUT); fill(g, w - 4, up + h - 4, 2, 4, OUT);
    // monitor with a glowing screen
    fill(g, 9, 0, 14, 11, OUT); fill(g, 10, 1, 12, 8, "#1f3346"); fill(g, 11, 2, 10, 6, GLOW);
    fill(g, 12, 3, 6, 1, "#e9f7ff"); fill(g, 12, 5, 8, 1, "#c4ecff");
    fill(g, 15, 10, 2, up - 10, OUT);
    fill(g, 7, up + 1, 9, 2, "#2b2f3a"); // keyboard
  },
  chair(g, _w, h, up) {
    fill(g, 3, 0, 10, 9, OUT); fill(g, 4, 1, 8, 7, "#3c4253"); fill(g, 4, 1, 8, 2, "#4c5366");
    fill(g, 2, up + 2, 12, 7, OUT); fill(g, 3, up + 3, 10, 5, "#4c5366");
    fill(g, 7, up + 9, 2, h - 10, OUT);
  },
  plant(g, _w, _h, up) {
    fill(g, 3, up + 4, 10, 12, OUT); fill(g, 4, up + 5, 8, 10, "#b8643f"); fill(g, 4, up + 5, 8, 2, "#d07a52");
    const leaves: [number, number][] = [[7, 0], [4, 3], [10, 3], [2, 7], [12, 7], [6, 6], [9, 7], [5, 10], [10, 10], [7, 12]];
    for (const [lx, ly] of leaves) { fill(g, lx, ly, 4, 4, OUT); fill(g, lx + 1, ly + 1, 2, 2, "#5fa36a"); px(g, lx + 1, ly + 1, "#7cc387"); }
  },
  shelf(g, w, h, up) {
    box(g, 0, 0, w, up + h, "#6b4a33", "#83603f", "#4a3323");
    const books = ["#c0392b", "#4a7ab5", "#e0b84a", "#6fae6f", "#8572ac", "#d16ba5", "#f4f1ea"];
    for (let row = 0; row < 3; row++) {
      const y = 3 + row * 8;
      fill(g, 2, y + 6, w - 4, 1, "#3e2a1e");
      for (let bx = 2, i = row; bx < w - 3; bx += 3, i++) fill(g, bx, y + (i % 2), 2, 6 - (i % 2), books[i % books.length]!);
    }
  },
  sofa(g, w, h, up) {
    fill(g, 0, 0, w, up + h, OUT);
    fill(g, 1, 1, w - 2, up - 1, "#4b4f7a"); fill(g, 1, 1, w - 2, 2, "#5d6196");
    fill(g, 1, up, w - 2, h - 2, "#5d6196"); fill(g, 1, up + h - 4, w - 2, 2, "#3c3f63");
    for (let i = 1; i < 3; i++) fill(g, (w / 3) * i, up, 1, h - 3, "#3c3f63");
  },
  board(g, w, h, up) {
    fill(g, 0, 0, w, up + 2, OUT); fill(g, 1, 1, w - 2, up, "#5e412d"); fill(g, 3, 3, w - 6, up - 4, "#b08a5a");
    for (let i = 0; i < 9; i++) { const nx = 5 + ((i * 13) % (w - 14)), ny = 5 + ((i * 7) % (up - 12)); fill(g, nx, ny, 6, 6, NOTE[i % NOTE.length]!); fill(g, nx, ny + 5, 6, 1, "rgba(0,0,0,0.2)"); }
    fill(g, 4, up + 2, 2, h - 2, OUT); fill(g, w - 6, up + 2, 2, h - 2, OUT);
  },
  kiosk(g, _w, h, up) {
    fill(g, 2, 0, 12, up + h, OUT); fill(g, 3, 1, 10, up + h - 2, "#e8e6e1"); fill(g, 3, 1, 10, 2, "#ffffff");
    fill(g, 4, 3, 8, 9, "#1f3346"); fill(g, 5, 4, 6, 7, GLOW); fill(g, 6, 6, 4, 1, "#ffffff"); fill(g, 6, 8, 3, 1, "#ffffff");
    fill(g, 3, up + h - 4, 10, 2, "#b9b6ae");
  },
  table(g, w, h, up) {
    box(g, 0, up - 1, w, h - 3, "#7a5638", "#946a47", "#5a3f29");
    fill(g, 6, up + 6, w - 12, 1, "#a47a57");
    for (const lx of [3, w - 5]) fill(g, lx, up + h - 6, 2, 6, OUT);
  },
  counter(g, w, h, up) {
    box(g, 0, 0, w, up + h, "#c9b79a", "#e0d1b7", "#9c8a6d");
    fill(g, 2, up + 4, w - 4, 1, "#9c8a6d");
    fill(g, w / 2 - 6, up + 6, 12, 4, "#ffffff"); // NC sign plate
    fill(g, w / 2 - 4, up + 7, 2, 2, OUT); fill(g, w / 2 + 2, up + 7, 2, 2, OUT);
  },
  frame(g, w, h, up) {
    fill(g, 2, 0, w - 4, up, OUT); fill(g, 3, 1, w - 6, up - 2, "#d9c9a3");
    fill(g, 5, 3, w - 10, up - 6, "#1d2433");
    const art = ["#e07a5f", "#3d405b", "#81b29a", "#f2cc8f"];
    for (let i = 0; i < 4; i++) fill(g, 6 + i * Math.floor((w - 12) / 4), 5 + (i % 2) * 4, Math.floor((w - 12) / 4) - 1, up - 14, art[i]!);
    fill(g, 6, up, 2, h, OUT); fill(g, w - 8, up, 2, h, OUT);
  },
  lamp(g, _w, h, up) {
    g.fillStyle = "rgba(255,216,154,0.18)"; g.beginPath(); g.arc(8, 6, 8, 0, Math.PI * 2); g.fill();
    fill(g, 3, 1, 10, 7, OUT); fill(g, 4, 2, 8, 5, WARM); fill(g, 4, 2, 8, 1, "#fff1d6");
    fill(g, 7, 8, 2, up + h - 11, OUT); fill(g, 4, up + h - 3, 8, 3, OUT);
  },
  rug(g, w, h) {
    fill(g, 0, 0, w, h, "#7a3b3b"); fill(g, 2, 2, w - 4, h - 4, "#9c4f4a"); fill(g, 4, 4, w - 8, h - 8, "#b8655c");
    for (let x = 4; x < w - 4; x += 4) { px(g, x, 3, WARM); px(g, x, h - 4, WARM); }
  },
  screen(g, w, h, up) {
    fill(g, 0, 0, w, up, OUT); fill(g, 1, 1, w - 2, up - 2, "#152233"); fill(g, 3, 3, w - 6, up - 6, "#1f3a55");
    fill(g, 6, 6, w / 3, 2, GLOW); fill(g, 6, 10, w / 2, 1, "#c4ecff"); fill(g, 6, 13, w / 2.5, 1, "#c4ecff");
    fill(g, w - 20, 6, 12, 10, "#2c5a80"); fill(g, w - 18, 12, 2, 4, GLOW); fill(g, w - 15, 9, 2, 7, GLOW); fill(g, w - 12, 7, 2, 9, GLOW);
    fill(g, 4, up, w - 8, h, "#2b2f3a"); fill(g, 4, up, w - 8, 2, "#3d4352");
  },
  podium(g, _w, h, up) {
    box(g, 2, 0, 12, up + h, "#5e412d", "#83603f", "#3e2a1e");
    fill(g, 1, 0, 14, 3, OUT); fill(g, 2, 1, 12, 1, "#a47a57");
    fill(g, 6, 5, 4, 3, "#ffffff");
  },
  bench(g, w, h, up) {
    box(g, 0, up, w, h - 2, "#8a6446", "#a47a57", "#5e412d");
    for (const lx of [2, w - 4]) fill(g, lx, up + h - 3, 2, 3, OUT);
  },
  coffee(g, _w, h, up) {
    fill(g, 2, 0, 12, up + h, OUT); fill(g, 3, 1, 10, up + h - 2, "#3a3f4a"); fill(g, 3, 1, 10, 2, "#4f5563");
    fill(g, 5, 4, 6, 3, "#ff8a5c"); fill(g, 6, 11, 4, 4, "#f4f1ea"); fill(g, 6, 11, 4, 1, "#6b4a33");
  },
  cabinet(g, _w, h, up) {
    box(g, 2, 0, 12, up + h, "#8c93a3", "#a9b0bf", "#6a7080");
    for (const y of [6, 15, 22]) { fill(g, 3, y, 10, 1, "#6a7080"); fill(g, 7, y - 3, 2, 1, OUT); }
  },
  portal(g, w, h, up) {
    fill(g, 0, 0, w, up + h, OUT);
    fill(g, 2, 2, w - 4, up + h - 2, "#20242c");
    fill(g, 4, 4, w - 8, up + h - 6, "#ffffff"); fill(g, 6, 6, w - 12, up + h - 10, "#dfe9f2");
    g.fillStyle = "rgba(143,216,255,0.35)"; g.fillRect(6, 6, w - 12, up + h - 10);
    fill(g, w / 2 - 3, 0, 6, 3, WARM);
  },
  elevator(g, w, h, up) {
    // steel doors in a dark frame, with the floor light above
    fill(g, 0, 0, w, up + h, OUT);
    fill(g, 1, 4, w - 2, up + h - 5, "#3d4352");
    fill(g, 3, 6, w / 2 - 4, up + h - 9, "#aab2c0"); fill(g, w / 2 + 1, 6, w / 2 - 4, up + h - 9, "#aab2c0");
    fill(g, 3, 6, w / 2 - 4, 2, "#cfd6e2"); fill(g, w / 2 + 1, 6, w / 2 - 4, 2, "#cfd6e2");
    fill(g, w / 2 - 1, 6, 2, up + h - 9, "#5b6272");
    fill(g, w / 2 - 6, 1, 12, 3, "#1f3346"); fill(g, w / 2 - 2, 1, 4, 2, WARM);
    fill(g, w - 3, up - 4, 2, 4, GLOW);
  },
  sign(g, w, h, up) {
    fill(g, 1, 0, w - 2, up - 2, OUT); fill(g, 2, 1, w - 4, up - 4, "#f4f1ea");
    // dot-matrix "text"
    for (let r = 0; r < 2; r++) for (let x = 5; x < w - 5; x += 2) if ((x * 7 + r * 3) % 5 !== 0) px(g, x, 5 + r * 4, OUT);
    fill(g, w / 2 - 1, up - 2, 2, h + 2, OUT);
  },
};

/** Draws one object at its footprint size plus its height above the floor. */
export function paintPiece(kind: Kind, wTiles: number, hTiles: number): HTMLCanvasElement {
  const up = UP[kind], w = wTiles * T, h = hTiles * T;
  const [c, g] = canvas(w, up + h);
  PAINT[kind](g, w, h, up);
  return c;
}

/** A soft round shadow drawn under characters. */
export function paintShadow(): HTMLCanvasElement {
  const [c, g] = canvas(14, 5);
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath(); g.ellipse(7, 2.5, 7, 2.5, 0, 0, Math.PI * 2); g.fill();
  return c;
}

/** The Northwind Cipher mark, rasterised from its vector paths into crisp pixels (no anti-aliasing). */
export function paintEmblem(size: number, paths: string[], color = "#ffffff"): HTMLCanvasElement {
  const [c, g] = canvas(size, size);
  g.scale(size / 912, size / 912);
  g.fillStyle = "#000";
  for (const d of paths) g.fill(new Path2D(d));
  g.setTransform(1, 0, 0, 1, 0, 0);
  const img = g.getImageData(0, 0, size, size);
  const [r, gg, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) as [number, number, number];
  for (let i = 0; i < img.data.length; i += 4) {
    const on = img.data[i + 3]! >= 110;
    img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = on ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** The eight colours a desk drawing can use; index 0 is the dark screen. */
export const SCREEN_PALETTE = ["#1f3346", "#ffffff", "#8fd8ff", "#ffd89a", "#f29e8e", "#a8d68f", "#c7b6f2", "#14161b"];

/** A member's 10 x 6 monitor drawing, as pixels (one palette index per character). */
export function paintScreen(screen: string): HTMLCanvasElement {
  const [c, g] = canvas(10, 6);
  for (let i = 0; i < 60; i++) fill(g, i % 10, Math.floor(i / 10), 1, 1, SCREEN_PALETTE[Number(screen[i] ?? 0)] ?? SCREEN_PALETTE[0]!);
  return c;
}

const BADGES: Record<string, [string, string[]]> = {
  star: ["#f2d16b", ["..#..", ".###.", "#####", ".###.", ".#.#."]],
  heart: ["#f29e8e", [".#.#.", "#####", "#####", ".###.", "..#.."]],
  bolt: ["#ffd89a", ["..##.", ".##..", "####.", "..##.", ".##.."]],
  leaf: ["#a8d68f", ["...##", "..###", ".###.", "###..", "#...."]],
  code: ["#8fd8ff", [".#.#.", "#...#", "#...#", "#...#", ".#.#."]],
  coffee: ["#e0b084", ["#.#..", ".....", "####.", "#####", "####."]],
  flag: ["#c0392b", ["####.", "#####", "####.", "#....", "#...."]],
  music: ["#c7b6f2", ["..###", "..#.#", "..#.#", "###.#", "##..."]],
};
export const BADGE_NAMES = Object.keys(BADGES);

/** A 5 x 5 badge icon. */
export function paintBadge(name: string): HTMLCanvasElement {
  const [c, g] = canvas(5, 5);
  const b = BADGES[name];
  if (b) b[1].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "#") px(g, x, y, b[0]); }));
  return c;
}
