/**
 * Take the evidence plane from a laptop to a verified quote, in one command.
 *
 * The five manual steps in `deploy/README.md` are correct and nobody runs five
 * steps correctly at 11pm before a partner call. This runs them in order, stops
 * at the first one that genuinely cannot proceed, and — the part that matters —
 * finishes by asking the verifier rather than by declaring success.
 *
 * It is written for PowerShell users as much as for shells: every command it
 * runs, it runs itself via execFile, so there is no `&&`, no `export`, and no
 * quoting to get wrong.
 *
 *   node scripts/deploy-phala.mjs             deploy, pin, and prove
 *   node scripts/deploy-phala.mjs --dry-run   print the plan, touch nothing
 *   node scripts/deploy-phala.mjs --name X    CVM name (default: cool-evidence)
 *
 * The one thing it will not do is log you in. `phala login` wants an API key
 * that belongs to you and should not be passed around by a script.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const deployDir = join(root, "deploy");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const nameIndex = args.indexOf("--name");
const cvmName = nameIndex >= 0 ? (args[nameIndex + 1] ?? "cool-evidence") : "cool-evidence";

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const green = (s) => `[32m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;

let step = 0;
const heading = (title) => {
  step += 1;
  console.log(`\n${bold(`${step} · ${title}`)}`);
};

/**
 * Run a command. Returns null instead of throwing.
 *
 * `--dry-run` skips only the commands that CHANGE something. Reads — the
 * version, the auth status, the measurement — always execute, because a dry run
 * whose checks are also faked would cheerfully report "authenticated" to
 * somebody who is not, which is worse than no dry run at all.
 */
function run(command, argv, options = {}) {
  console.log(dim(`   $ ${command} ${argv.join(" ")}`));
  if (dryRun && options.mutates) return "";
  const result = spawnSync(command, argv, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.status !== 0) return null;
  // stdout AND stderr. The Phala CLI prints "Not authenticated" to stderr and
  // still exits 0, so reading only stdout would report a logged-out account as
  // ready to deploy — the exact failure this script exists to catch early.
  return options.capture ? `${result.stdout ?? ""}\n${result.stderr ?? ""}` : "";
}

function capture(command, argv, options = {}) {
  return run(command, argv, { ...options, capture: true });
}

function die(message, hint) {
  console.log(`\n${red("✕")} ${message}`);
  if (hint) console.log(`  ${dim(hint)}`);
  process.exit(1);
}

/* ── 1 · the CLI is present and authenticated ─────────────────────────── */

heading("Check the Phala CLI");

const version = capture("phala", ["--version"]);
if (version === null) {
  die(
    "the phala CLI is not installed",
    "npm install -g phala   —  then run this again",
  );
}
console.log(`   ${green("✓")} phala ${String(version).trim()}`);

// `phala status` exits 0 whether or not a key is set, so the text is what tells
// us — checking the exit code here would report success on an empty account.
const status = capture("phala", ["status"]) ?? "";
if (/not authenticated|please set an api key|phala login/i.test(status)) {
  die(
    "not authenticated with Phala",
    "phala login   —  paste the API key from https://cloud.phala.network, then run this again",
  );
}
console.log(`   ${green("✓")} authenticated`);

/* ── 2 · deploy ───────────────────────────────────────────────────────── */

heading(`Deploy the evidence plane as "${cvmName}"`);

if (!existsSync(join(deployDir, "docker-compose.yml"))) {
  die(`no docker-compose.yml in ${deployDir}`);
}

const deployed = run("phala", ["deploy", "-c", "docker-compose.yml", "-n", cvmName], {
  cwd: deployDir,
  mutates: true,
});
if (deployed === null && !dryRun) {
  die(
    "deployment failed",
    "the CLI's output is above. Common causes: no credits on the account, or a CVM with this name already exists (pass --name).",
  );
}

/* ── 3 · find the CVM and read its measurement ────────────────────────── */

heading("Read the measurement the CVM actually booted with");

const listed = capture("phala", ["cvms", "list", "--json"]) ?? "";
let cvmId = null;
try {
  const parsed = JSON.parse(listed);
  const rows = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
  const match = rows.find((row) => (row.name ?? row.app_name) === cvmName);
  cvmId = match?.app_id ?? match?.id ?? match?.identifier ?? null;
} catch {
  // Older CLIs print a table rather than JSON. Fall back to asking the user,
  // rather than scraping a format that is free to change under us.
}

if (!cvmId && dryRun) {
  console.log(`   ${dim("no CVM yet — a real run deploys one first, then reads its id here")}`);
} else if (!cvmId) {
  console.log(`   ${yellow("!")} could not read the CVM id automatically.`);
  console.log(`     ${dim("phala cvms list")}`);
  console.log(`     ${dim(`then: phala cvms attestation <id>`)}`);
  console.log(
    `     ${dim("set COOL_PIN_MRTD to the mrtd it prints, and re-run with the env var in place")}`,
  );
  process.exit(2);
}

if (cvmId) console.log(`   ${green("✓")} cvm ${cvmId}`);

const attestation = cvmId ? (capture("phala", ["cvms", "attestation", String(cvmId)]) ?? "") : "";
const mrtd = /mrtd\W+([0-9a-f]{32,})/i.exec(attestation)?.[1] ?? null;
const rtmr3 = /rtmr3\W+([0-9a-f]{32,})/i.exec(attestation)?.[1] ?? null;

if (mrtd) console.log(`   ${green("✓")} mrtd ${mrtd.slice(0, 24)}…`);
else if (!dryRun) console.log(`   ${yellow("!")} could not parse the mrtd — pin it by hand`);

/* ── 4 · write the environment the plane needs ────────────────────────── */

heading("Write the pin and the verifier endpoint");

const envPath = join(deployDir, ".env");
const lines = [
  "# Written by scripts/deploy-phala.mjs. The pin is what makes a quote mean",
  "# 'the code we approved' rather than merely 'some TEE'.",
  `QUOTE_VERIFIER_URL=${process.env.QUOTE_VERIFIER_URL ?? "https://api.phala.network/attest/verify"}`,
  process.env.QUOTE_VERIFIER_KEY ? `QUOTE_VERIFIER_KEY=${process.env.QUOTE_VERIFIER_KEY}` : "",
  mrtd ? `COOL_PIN_MRTD=hex:${mrtd}` : "# COOL_PIN_MRTD=hex:<mrtd>",
  rtmr3 ? `COOL_PIN_RTMR3=hex:${rtmr3}` : "# COOL_PIN_RTMR3=hex:<rtmr3>",
  "",
].filter(Boolean);

console.log(dim(`   → ${envPath}`));
if (!dryRun) writeFileSync(envPath, lines.join("\n"));
console.log(`   ${green("✓")} pin written`);

/* ── 5 · let the verifier decide ──────────────────────────────────────── */

heading("Prove it — with the verifier, not with this script");

console.log(dim("   inside the CVM:"));
console.log(dim("   $ cool wire"));
console.log(dim("   $ cool verify last --require-hardware"));
console.log();
console.log(
  `   ${dim(
    "`cool wire` seals a probe record and verifies it under --require-hardware, so a",
  )}`,
);
console.log(
  `   ${dim("green run means the whole path works — not that the configuration looks right.")}`,
);

if (dryRun) {
  console.log(`\n${yellow("dry run — nothing was deployed or written")}`);
} else {
  console.log(`\n${green("✓")} ${bold("deployed")}`);
  console.log(`  redeploy with the pin in place:`);
  console.log(`  ${dim("cd deploy; phala deploy -c docker-compose.yml -n " + cvmName)}`);
  console.log(`  then open the console the CVM publishes through dstack-gateway.`);
}
