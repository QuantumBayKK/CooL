/**
 * Compile the package — and make `npm pack` incapable of producing a broken one.
 *
 * This used to live in the site's build script, which meant `npm pack` or
 * `npm publish` run by hand produced a tarball whose emitted imports were
 * extensionless and therefore unresolvable by Node. The consumer check caught
 * it; the fix is to make the packaging step itself do the work, via `prepack`,
 * so there is no way to publish the broken version.
 *
 * Two steps:
 *   1. tsc, from `../../src/lib/cool` into `dist`;
 *   2. rewrite relative specifiers to add `.js` / `/index.js`, because
 *      TypeScript emits them exactly as written and the source is authored for
 *      a bundler.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const require = createRequire(import.meta.url);

/* 1 · compile */
rmSync(dist, { recursive: true, force: true });
// Resolve the compiler explicitly rather than trusting `npx` to walk up out of
// a workspace directory that has no node_modules of its own.
const tsc = require.resolve("typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "-p", join(here, "tsconfig.build.json")], {
  stdio: "inherit",
});

/* 2 · make the emitted specifiers resolvable by Node's ESM loader */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const SPECIFIER = /(from\s*|import\s*\(\s*|import\s+)(['"])(\.[^'"]*)\2/g;
let patched = 0;
let unresolved = 0;

for (const file of walk(dist)) {
  if (!file.endsWith(".js") && !file.endsWith(".d.ts")) continue;
  const source = readFileSync(file, "utf8");
  const next = source.replace(SPECIFIER, (match, head, quote, specifier) => {
    if (/\.(js|json|mjs)$/.test(specifier)) return match;
    const target = resolve(dirname(file), specifier);
    let resolved = null;
    try {
      statSync(`${target}.js`);
      resolved = `${specifier}.js`;
    } catch {
      try {
        statSync(join(target, "index.js"));
        resolved = `${specifier}/index.js`;
      } catch {
        unresolved++;
        console.error(`  ! unresolvable specifier '${specifier}' in ${relative(here, file)}`);
      }
    }
    return resolved ? `${head}${quote}${resolved}${quote}` : match;
  });
  if (next !== source) {
    writeFileSync(file, next);
    patched++;
  }
}

if (unresolved > 0) {
  // Publishing a package whose imports do not resolve is worse than not
  // publishing one, so this is fatal rather than a warning.
  console.error(`\n${unresolved} unresolvable specifier(s) — refusing to build.`);
  process.exit(1);
}

/* 3 · copy the static assets tsc does not know about
 *
 * `cool ui` serves one self-contained HTML file, read from beside its own
 * module at runtime. tsc only emits .js/.d.ts, so without this step the command
 * would compile perfectly and then 500 on its first request — which is exactly
 * the class of breakage step 2 exists to prevent, so it is fatal here too. */
const ASSETS = [["cli/ui/app.html", "cli/ui/app.html"]];
const source = resolve(here, "../../src/lib/cool");

for (const [from, to] of ASSETS) {
  const src = join(source, from);
  const dest = join(dist, to);
  try {
    statSync(src);
  } catch {
    console.error(`\nmissing asset ${from} — refusing to build.`);
    process.exit(1);
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

console.log(
  `cool-tee: compiled and patched ${patched} files into dist/, copied ${ASSETS.length} asset(s)`,
);
