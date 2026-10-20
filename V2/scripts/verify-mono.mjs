/**
 * Monochrome palette audit for the film-led site.
 *
 * The rule: #000 and #fff are the palette. The only other colour values
 * allowed are those two at an opacity — rgba(0,0,0,a) / rgba(255,255,255,a).
 * This scans every stylesheet, component and lib file of the film-led site
 * (CSS, inline styles, SVG fill/stroke, canvas fillStyle) for colour
 * literals, and checks that every film frame and texture PNG is genuinely
 * 1-bit greyscale — so the footage treatment cannot drift into grey either.
 *
 * Run: node scripts/verify-mono.mjs   (exits non-zero on any violation)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN = [
  "src/app/(film)",
  "src/components/film",
  "src/lib/film",
  "src/app/not-found.tsx",
  "public/partners/phala-mono.svg",
];
const EXT = /\.(css|tsx?|svg)$/;

const ALLOWED_HEX = new Set(["#000", "#000000", "#fff", "#ffffff"]);
const HEX = /#[0-9a-f]{3,8}\b/gi;
const FUNC = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*([^)]*)\)/gi;

function okFunc(name, args) {
  if (!/^rgba?$/i.test(name)) return false;
  const parts = args.split(/[\s,/]+/).filter(Boolean);
  const [r, g, b] = parts.map(Number);
  return (r === 0 && g === 0 && b === 0) || (r === 255 && g === 255 && b === 255);
}

function walk(p, out) {
  const abs = join(ROOT, p);
  const st = statSync(abs);
  if (st.isDirectory()) for (const f of readdirSync(abs)) walk(join(p, f), out);
  else if (EXT.test(abs)) out.push(abs);
  return out;
}

const failures = [];
const files = SCAN.flatMap((p) => walk(p, []));
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    // URL fragments (href="/#pipeline", "#main") are not colours.
    const scrubbed = line.replace(/(\/|["'`\s])#[\w-]*[g-z_-][\w-]*/gi, "$1");
    for (const m of scrubbed.matchAll(HEX)) {
      if (!ALLOWED_HEX.has(m[0].toLowerCase())) failures.push(`${relative(ROOT, file)}:${i + 1}  ${m[0]}`);
    }
    for (const m of line.matchAll(FUNC)) {
      if (!okFunc(m[1], m[2])) failures.push(`${relative(ROOT, file)}:${i + 1}  ${m[0]}`);
    }
  });
}

// Every film PNG must be 1-bit greyscale (IHDR bit depth 1, colour type 0).
let frames = 0;
for (const dir of ["public/film/hero", "public/film/recorder", "public/film", "public/partners"]) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (!f.endsWith(".png") || (dir === "public/partners" && !f.includes("-mono"))) continue;
    const buf = readFileSync(join(ROOT, dir, f));
    const depth = buf[24];
    const type = buf[25];
    frames++;
    if (depth !== 1 || type !== 0) failures.push(`${dir}/${f}  PNG is ${depth}-bit type ${type}, expected 1-bit greyscale`);
  }
}

if (failures.length) {
  console.error(`  FAIL  ${failures.length} non-monochrome value(s):`);
  for (const f of failures) console.error(`        ${f}`);
  process.exit(1);
}
console.log(`  scanned ${files.length} files and ${frames} film PNGs — monochrome only`);
