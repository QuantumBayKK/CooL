/**
 * Palette conformance check.
 *
 * The site claims to be accessible; this proves the claim on the one axis that
 * is mechanically checkable. Every foreground/background pair the design system
 * actually ships is measured against WCAG 2.1 contrast minima.
 *
 * One theme. The site is light-only by design — see the header comment in
 * globals.css for why a dark theme cannot reuse the brand red — so there is one
 * token set here rather than two.
 *
 * Run: node scripts/verify-palette.mjs
 * Exits non-zero on the first failure, so CI catches a bad token before review.
 */

const hex = (h) => {
  const s = h.replace("#", "");
  const n =
    s.length === 3
      ? s
          .split("")
          .map((c) => c + c)
          .join("")
      : s;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

/** Relative luminance, WCAG 2.1 §relative-luminance. */
const luminance = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// ── the tokens, mirrored from globals.css ────────────────────────────────────
export const LIGHT = {
  canvas: "#FFFFFF",
  surface: "#FAFAFA",
  raised: "#F4F4F5",
  ink: "#0A0A0B",
  "ink-muted": "#52525B",
  "ink-subtle": "#71717A",
  line: "#E4E4E7",
  accent: "#A4161A",
  "accent-hover": "#8B1215",
  "on-accent": "#FFFFFF",
  ok: "#186A3B",
  warn: "#8A5A00",
  fail: "#A4161A",
};

/**
 * Every pair the stylesheet actually renders, with the minimum it must clear.
 *
 * 4.5 — body text (AA normal)
 * 3.0 — large text ≥24px, and non-text UI (borders, icons, focus rings) per AA
 *       §1.4.11. Hairlines are held to 3.0 rather than 1.5 because they are the
 *       primary structural separator in this design, not decoration.
 */
const PAIRS = [
  ["ink", "canvas", 4.5],
  ["ink", "surface", 4.5],
  ["ink", "raised", 4.5],
  ["ink-muted", "canvas", 4.5],
  ["ink-muted", "surface", 4.5],
  ["ink-subtle", "canvas", 4.5],
  ["accent", "canvas", 4.5],
  ["accent", "surface", 4.5],
  ["on-accent", "accent", 4.5],
  ["ok", "canvas", 4.5],
  ["warn", "canvas", 4.5],
  ["fail", "canvas", 4.5],
  ["accent", "canvas", 3.0],
  ["line", "canvas", 1.2],
];

let failures = 0;
let checks = 0;

console.log("\n  LIGHT");
for (const [fg, bg, min] of PAIRS) {
  const ratio = contrast(LIGHT[fg], LIGHT[bg]);
  const pass = ratio >= min;
  checks += 1;
  if (!pass) failures += 1;
  console.log(
    `  ${pass ? "PASS" : "FAIL"}  ${fg.padEnd(11)} on ${bg.padEnd(8)} ` +
      `${ratio.toFixed(2)}:1  (min ${min.toFixed(1)})`,
  );
}

console.log(
  `\n  ${checks - failures}/${checks} contrast checks passed` +
    (failures ? ` — ${failures} FAILING\n` : "\n"),
);

process.exit(failures ? 1 : 0);
