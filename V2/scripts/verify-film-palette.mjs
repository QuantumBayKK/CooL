/**
 * Contrast audit for the public site's palette (src/app/(film)/film.css).
 *
 * Reads the colour tokens straight out of the stylesheet and checks every
 * text/background pair the site actually renders against WCAG 2.1 AA
 * (4.5:1 for text). Exits non-zero on the first failing pair, so a token
 * change that hurts legibility cannot ship.
 *
 * Run: node scripts/verify-film-palette.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("../src/app/(film)/film.css", import.meta.url)), "utf8");
const root = css.slice(css.indexOf(".film {"), css.indexOf("}", css.indexOf(".film {")));
const tok = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2]]));

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const v = (k) => (k.startsWith("#") ? k : tok[k]);

const PAIRS = [
  ["ink", "bg"],
  ["ink", "bg-2"],
  ["ink-2", "bg"],
  ["ink-2", "bg-2"],
  ["ink-3", "bg"],
  ["ink-3", "bg-2"],
  ["brand", "bg"],
  ["brand", "bg-2"],
  ["brand", "brand-soft"],
  ["#ffffff", "brand"],
  ["#ffffff", "brand-2"],
  ["ok", "ok-bg"],
  ["warn", "warn-bg"],
  ["bad", "bad-bg"],
  ["muted-chip", "muted-bg"],
  ["on-dark", "dark"],
  ["on-dark-2", "dark"],
  ["on-dark-2", "dark-2"],
  ["#ffffff", "dark"],
  ["#a9c6f5", "dark"],
  // terminal
  ["#e6edf7", "code"],
  ["#9aa9c0", "code"],
  ["#9aa9c0", "#0e1626"],
  ["#6fe3a0", "code"],
  ["#ff9a8f", "code"],
  ["#ffcf7a", "code"],
  ["#c3cddc", "code"],
  ["#a9c6f5", "code"],
];

let fail = 0;
for (const [fg, bg] of PAIRS) {
  const a = v(fg);
  const b = v(bg);
  if (!a || !b) {
    console.error(`  FAIL  unknown token in pair ${fg} / ${bg}`);
    fail++;
    continue;
  }
  const r = ratio(a, b);
  const ok = r >= 4.5;
  if (!ok) fail++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${fg.padEnd(11)} on ${bg.padEnd(11)} ${r.toFixed(2)}:1`);
}
if (fail) {
  console.error(`\n  ${fail} pair(s) below WCAG AA 4.5:1`);
  process.exit(1);
}
console.log(`\n  ${PAIRS.length}/${PAIRS.length} text pairs pass WCAG AA`);
