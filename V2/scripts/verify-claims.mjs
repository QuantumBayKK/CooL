/**
 * Claim conformance check.
 *
 * CooL's product refuses to let `simulated` round up to `pass`. This script is
 * the same rule applied to the website: a phrase reserved for a readiness gate
 * above the one we are actually on cannot ship, and no amount of good intent
 * from whoever is editing copy can get it past CI.
 *
 * It reads the ladder from `src/content/gates.ts`, so raising the site's claims
 * is a deliberate one-line edit there rather than a drift nobody noticed.
 *
 * Run: node scripts/verify-claims.mjs
 *
 * Scope — user-visible copy only:
 *   src/app, src/components, src/content, content/docs
 * Excluded:
 *   · gates.ts itself, which necessarily contains every reserved phrase
 *   · anything between `claim-exempt:start` / `claim-exempt:end` markers, for
 *     places we must name a standard in order to say we do NOT hold it
 *     ("we are not SOC 2 certified" has to be sayable)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const ROOTS = ["src/app", "src/components", "src/content", "content"];
const EXT = new Set([".ts", ".tsx", ".md", ".mdx"]);
const SKIP_FILES = new Set(["gates.ts"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "cool"]);

// ── read the ladder without needing a TS toolchain ──────────────────────────
// A regex over the source is deliberate: adding a build step to a guard script
// gives the guard a way to fail open, and a guard that fails open is worse than
// no guard because it is trusted.
const gatesSrc = readFileSync(join(ROOT, "src/content/gates.ts"), "utf8");

const currentGate = Number(
  gatesSrc.match(/export const CURRENT_GATE\s*=\s*(\d+)/)?.[1] ?? "0",
);

const reserved = [
  ...gatesSrc.matchAll(/\{\s*phrase:\s*"([^"]+)",\s*gate:\s*(\d+)\s*\}/g),
].map((m) => ({ phrase: m[1].toLowerCase(), gate: Number(m[2]) }));

if (reserved.length === 0) {
  console.error("  FAIL  could not parse RESERVED_CLAIMS from gates.ts");
  process.exit(1);
}

// Only phrases above our rung are forbidden. At Gate 2 the Gate-2 sentences
// become sayable automatically, which is the point of storing the gate number.
const forbidden = reserved.filter((r) => r.gate > currentGate);

// ── walk ────────────────────────────────────────────────────────────────────
function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // optional root (content/ may not exist yet)
  }
  for (const name of entries) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      yield* walk(full);
    } else if (EXT.has(name.slice(name.lastIndexOf(".")))) {
      if (SKIP_FILES.has(name)) continue;
      yield full;
    }
  }
}

/** Blank out exempt regions so their line numbers still line up. */
function stripExempt(text) {
  return text.replace(
    /claim-exempt:start[\s\S]*?claim-exempt:end/g,
    (block) => block.replace(/[^\n]/g, " "),
  );
}

let violations = 0;
let scanned = 0;

for (const root of ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    scanned += 1;
    const lines = stripExempt(readFileSync(file, "utf8")).split(/\r?\n/);

    lines.forEach((line, i) => {
      const hay = line.toLowerCase();
      for (const { phrase, gate } of forbidden) {
        const at = hay.indexOf(phrase);
        if (at === -1) continue;
        violations += 1;
        const where = relative(ROOT, file).split(sep).join("/");
        const licensed =
          gate === 99
            ? "no gate ever licenses this phrase"
            : `licensed only at Gate ${gate}; we are at Stage ${currentGate}`;
        console.error(
          `\n  FAIL  ${where}:${i + 1}\n` +
            `        reserved phrase: "${phrase}"\n` +
            `        ${licensed}\n` +
            `        ${line.trim().slice(0, 100)}`,
        );
      }
    });
  }
}

console.log(
  `\n  scanned ${scanned} files against ${forbidden.length} reserved phrases ` +
    `(current rung: Stage ${currentGate})`,
);

if (violations) {
  console.error(
    `\n  ${violations} claim violation(s).\n\n` +
      `  Either rewrite the copy, or — if the evidence genuinely exists —\n` +
      `  raise CURRENT_GATE in src/content/gates.ts and tick the items that\n` +
      `  justify it. Do not add an exemption to make this pass.\n`,
  );
  process.exit(1);
}

console.log("  no over-claims found\n");
