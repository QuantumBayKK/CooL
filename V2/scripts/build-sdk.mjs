/**
 * Build the publishable SDK from the source the site itself runs on.
 *
 * The package is compiled from `src/lib/cool` rather than from a copy of it.
 * That is the whole point: the library a visitor downloads and the library that
 * produced the receipts on `/studio` cannot drift, because there is only one of
 * them. Anything else and the demo eventually stops being evidence of the
 * product.
 *
 * Produces four artefacts under `public/sdk/`, all served from the site:
 *
 *   <name>-<version>.tgz     an npm tarball — `npm install <url>` works for
 *                            anyone, with no npm account and no registry.
 *   <name>.js                a single-file ESM bundle of the confidential-compute
 *                            tier, importable straight from a browser or Deno.
 *   checksums.txt            sha256 of both, so a download can be checked.
 *   manifest.json            machine-readable index of the above.
 *
 * Run with:  npm run sdk:build
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "packages", "cool-nwc");
const outDir = join(root, "public", "sdk");

const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const version = pkg.version;
// Every artefact name is derived, never typed twice.
// Two names for the same bytes. The unversioned one is convenient and moves
// under your feet; the versioned one never changes, which is the only kind of
// URL you should put in a page you are not watching.
const bundleName = `${pkg.name}.js`;
const pinnedBundleName = `${pkg.name}-${version}.js`;
const tarballName = `${pkg.name}-${version}.tgz`;

const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });

const step = (message) => console.log(`\n▸ ${message}`);

/* ── 1 · compile ──────────────────────────────────────────────────────── */

// The package compiles and patches itself through its own `prepack` hook, so
// `npm pack` below cannot produce a tarball that differs from this one. Running
// it here as well keeps the failure early and the output readable.
step("compiling the package");
run("node", [join(pkgDir, "build.mjs")], pkgDir);

/* ── 3 · the browser bundle ───────────────────────────────────────────── */

step("bundling the confidential-compute tier for browsers");
mkdirSync(outDir, { recursive: true });

const { build } = await import("esbuild");
const banner = `/*! ${pkg.name} v${version} — Apache-2.0 — https://northwindcipher.com/sdk
 * Confidential-compute tier: dstack, measurement-sealed keys, RA-TLS capture,
 * cool.receipt.v2 and its offline verifier. Import directly:
 *   import { CoolTee, verifyReceiptV2 } from "https://northwindcipher.com/sdk/cool-nwc.js";
 */`;

await build({
  entryPoints: [join(root, "src", "lib", "cool", "phala", "index.ts")],
  outfile: join(outDir, bundleName),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  legalComments: "none",
  banner: { js: banner },
});

// The pinned copy is written from the freshly built bytes, so the two can never
// disagree about what version `cool-nwc-2.2.0.js` contains.
copyFileSync(join(outDir, bundleName), join(outDir, pinnedBundleName));

/* ── 4 · the npm tarball ──────────────────────────────────────────────── */

step("packing the npm tarball");
run("npm", ["pack", "--silent"], pkgDir);
const packed = readdirSync(pkgDir).find((name) => name.endsWith(".tgz"));
if (!packed) throw new Error("npm pack produced no tarball");
copyFileSync(join(pkgDir, packed), join(outDir, tarballName));
rmSync(join(pkgDir, packed));

/* ── 5 · checksums and manifest ───────────────────────────────────────── */

step("writing checksums and manifest");
const artefacts = [tarballName, bundleName, pinnedBundleName].map((name) => {
  const bytes = readFileSync(join(outDir, name));
  return {
    file: name,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
});

writeFileSync(
  join(outDir, "checksums.txt"),
  [
    `# ${pkg.name} v${version} — sha256`,
    "#",
    "# Verify what you downloaded:",
    `#   sha256sum ${tarballName}`,
    `#   shasum -a 256 ${bundleName}`,
    "",
    ...artefacts.map((a) => `${a.sha256}  ${a.file}`),
    "",
  ].join("\n"),
);

/**
 * Is this version actually on the registry?
 *
 * The /sdk page advertises `npm install cool-nwc` only when that command really
 * works. Asking the registry at build time means the page can never promise an
 * install that 404s — and it starts telling the truth the moment
 * `npm run release` succeeds, with no copy to remember to change.
 */
async function publishedOnRegistry() {
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkg.name}/${version}`, {
      signal: AbortSignal.timeout(4000),
    });
    return response.ok;
  } catch {
    // Offline builds simply fall back to the tarball instructions.
    return false;
  }
}

const onRegistry = await publishedOnRegistry();
console.log(`  registry                 ${pkg.name}@${version} ${onRegistry ? "published" : "not published yet"}`);

writeFileSync(
  join(outDir, "manifest.json"),
  `${JSON.stringify(
    {
      name: pkg.name,
      version,
      license: pkg.license,
      description: pkg.description,
      docs: "https://northwindcipher.com/sdk",
      registry: {
        published: onRegistry,
        install: `npm install ${pkg.name}`,
        global: `npm install -g ${pkg.name}`,
      },
      install: {
        npm: `npm install https://northwindcipher.com/sdk/${tarballName}`,
        esm: `https://northwindcipher.com/sdk/${bundleName}`,
        esmPinned: `https://northwindcipher.com/sdk/${pinnedBundleName}`,
      },
      artefacts,
    },
    null,
    2,
  )}\n`,
);

for (const a of artefacts) {
  console.log(`  ${a.file.padEnd(24)} ${(a.bytes / 1024).toFixed(1)} kB  ${a.sha256.slice(0, 16)}…`);
}

console.log(`\nSDK v${version} built into public/sdk.\n`);
