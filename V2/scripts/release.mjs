/**
 * Publish to npm — but only after everything that can be checked, has been.
 *
 * Publishing is the one irreversible action in this repository: a version can be
 * deprecated but never replaced, and an unpublished name is blocked forever
 * (which is exactly why `northwind` is unavailable to us). So this script runs
 * the full battery first and refuses to continue on a single failure:
 *
 *   typecheck → unit tests → v1 conformance → TEE conformance →
 *   consumer install check → artefact build → registry name check
 *
 * Then it publishes `cool-nwc`, and — with `--alias` — the thin
 * `@northwindcipher/cool-tee` package that re-exports it, so both import styles
 * resolve to one implementation.
 *
 *   npm run release -- --dry-run          rehearse everything, publish nothing
 *   npm run release                       publish cool-nwc
 *   npm run release -- --alias            publish the cool-tee alias too
 *   npm run release -- --otp=123456       pass a 2FA code non-interactively
 *
 * npm requires two-factor authentication to publish. Either enable an
 * authenticator app on the account and answer npm's prompt, or use a granular
 * access token with "bypass 2FA" enabled for CI.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "packages", "cool-nwc");
const aliasDir = join(root, "packages", "alias");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const withAlias = args.includes("--alias");
const skipChecks = args.includes("--skip-checks");
// npm now requires 2FA to publish. The one-time code can be passed through
// here, or typed at npm's own prompt — the publish step inherits this terminal.
const otpArg = args.find((a) => a.startsWith("--otp="));
const otp = otpArg ? otpArg.slice("--otp=".length) : null;

const npmShell = process.platform === "win32";
const run = (command, cmdArgs, cwd = root, capture = false) =>
  execFileSync(command, cmdArgs, {
    cwd,
    shell: npmShell && (command === "npm" || command === "npx"),
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });

const step = (message) => console.log(`\n▸ ${message}`);
const fail = (message) => {
  console.error(`\n✕ ${message}\n`);
  process.exit(1);
};

const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const alias = JSON.parse(readFileSync(join(aliasDir, "package.json"), "utf8"));

console.log(`\nReleasing ${pkg.name}@${pkg.version}${dryRun ? "  (dry run)" : ""}`);

/* ── who is publishing ────────────────────────────────────────────────── */

let whoami = "";
try {
  whoami = run("npm", ["whoami"], root, true).trim();
} catch {
  fail("not logged in to npm. Run `npm login` first (npmjs.com account required).");
}
console.log(`  as ${whoami}`);

/* ── is the name still free / ours? ───────────────────────────────────── */

step("checking the registry");

/**
 * Work out what actually needs publishing.
 *
 * A version that is already up cannot be replaced, and reaching it is not an
 * error — it happens every time the first of two packages succeeds and the
 * second needs a fresh 2FA code. So an already-published target is skipped with
 * a note, and only a name owned by someone else is fatal.
 */
// Each target carries its own version: the alias can be patched independently
// of the library it re-exports, and usually is.
const targets = [{ dir: pkgDir, name: pkg.name, version: pkg.version }];
if (withAlias) targets.push({ dir: aliasDir, name: alias.name, version: alias.version });

const pending = [];
for (const target of targets) {
  let existing = null;
  try {
    existing = JSON.parse(run("npm", ["view", target.name, "--json"], root, true));
  } catch {
    console.log(`  ${target.name} — free (first publish)`);
    pending.push(target);
    continue;
  }
  const owners = (existing.maintainers ?? []).map((m) =>
    typeof m === "string" ? m.split(" ")[0] : m.name,
  );
  if (owners.length > 0 && !owners.includes(whoami)) {
    fail(`${target.name} exists and is owned by ${owners.join(", ")} — not you.`);
  }
  const versions = Array.isArray(existing.versions) ? existing.versions : [existing.version];
  if (versions.includes(target.version)) {
    console.log(`  ${target.name}@${target.version} — already published, skipping`);
    continue;
  }
  console.log(`  ${target.name} — yours, latest ${existing.version ?? "?"}`);
  pending.push(target);
}

if (pending.length === 0) {
  console.log("\nEverything at this version is already on the registry. Bump to publish again.\n");
  process.exit(0);
}

/* ── prove it works before anyone can install it ──────────────────────── */

if (skipChecks) {
  console.log("\n  ! --skip-checks: publishing without verification");
} else {
  step("typecheck");
  run("npm", ["run", "typecheck"]);
  step("unit tests");
  run("npm", ["test"]);
  step("conformance — v1 receipts");
  run("npm", ["run", "verify:sdk"]);
  step("conformance — TEE tier");
  run("npm", ["run", "verify:tee"]);
  step("the package works on install");
  run("npm", ["run", "verify:package"]);
  step("building the published artefacts");
  run("npm", ["run", "sdk:build"]);
}

/* ── publish ──────────────────────────────────────────────────────────── */

step(dryRun ? "publishing (dry run)" : "publishing");

const publishArgs = [
  "publish",
  "--access",
  "public",
  ...(otp ? ["--otp", otp] : []),
  ...(dryRun ? ["--dry-run"] : []),
];

/**
 * Publish one package, and turn npm's least helpful error into instructions.
 *
 * The 403 npm returns when two-factor is required says nothing about what to do
 * next, and it arrives after five minutes of passing checks — the worst possible
 * moment to be handed a stack trace.
 */
const publish = (dir, name) => {
  try {
    run("npm", publishArgs, dir);
  } catch (error) {
    const text = `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}`;
    if (/one-time password|2fa|two-factor|EOTP|E403/i.test(text)) {
      fail(
        [
          `${name} was NOT published: npm requires a two-factor code.`,
          "",
          "  1. npmjs.com → Account → Two-Factor Authentication → enable with an",
          "     authenticator app (choose 'Authorization and writes').",
          "  2. Re-run with the six-digit code:",
          "",
          "       npm run release -- --alias --otp=123456",
          "",
          "  For CI instead: create a granular access token with 'Bypass 2FA'",
          "  enabled and set it as NPM_TOKEN / in .npmrc.",
        ].join("\n"),
      );
    }
    fail([`${name} was NOT published.`, "", ...text.split("\n").slice(0, 12)].join("\n"));
  }
};
for (const target of pending) {
  if (target.dir !== pkgDir) step(dryRun ? "publishing the alias (dry run)" : "publishing the alias");
  publish(target.dir, target.name);
}

console.log(`
${dryRun ? "Dry run complete — nothing was published." : `Published ${pkg.name}@${pkg.version}.`}

  npm install ${pkg.name}
  npm install -g ${pkg.name}   →  the \`cool\` command
${withAlias ? `  npm install ${alias.name}   (alias)\n` : ""}
Next: update the version referenced by /sdk (npm run sdk:build already did),
redeploy the site, and tag the release.
`);
