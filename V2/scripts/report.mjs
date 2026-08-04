/**
 * One command that produces the evidence for a release.
 *
 * "Are the tests passing" is a question somebody asks before a partner call, an
 * investor update or a publish, and the honest answer has about eight parts. So
 * this runs all of them, captures exit codes rather than vibes, and writes a
 * dated report to `reports/`.
 *
 * The rule it follows is the same one the product follows: a check that could
 * not be run is reported as SKIPPED, never quietly dropped, and a non-zero exit
 * is a FAIL even if the output looked fine. The summary is derived from those
 * codes, so the report cannot be greener than the run.
 *
 *   npm run report
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "packages", "cool-nwc", "package.json"), "utf8"));
const site = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const shell = process.platform === "win32";
const startedAt = new Date();

const run = (command, args, cwd = root) => {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      shell: shell && (command === "npm" || command === "npx"),
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    return { ok: true, code: 0, out: stdout };
  } catch (error) {
    return {
      ok: false,
      code: error.status ?? 1,
      out: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
};

const results = [];
function check(name, what, fn) {
  process.stdout.write(`  ${name} … `);
  const started = Date.now();
  const result = fn();
  const ms = Date.now() - started;
  results.push({ name, what, ...result, ms });
  console.log(result.ok ? `ok (${ms}ms)` : `FAILED (exit ${result.code})`);
  return result;
}

console.log(`\nCooL — release report for ${pkg.name}@${pkg.version}\n`);

/* ── 1 · static analysis ──────────────────────────────────────────────── */

check("typecheck", "TypeScript, strict, whole repo", () => run("npm", ["run", "typecheck"]));
check("lint", "next lint", () => run("npm", ["run", "lint"]));

/* ── 2 · tests ────────────────────────────────────────────────────────── */

const tests = check("unit tests", "node:test across the SDK and the CLI", () =>
  run("npm", ["test"]),
);
const testCounts = {
  total: Number(/ℹ tests (\d+)/.exec(tests.out)?.[1] ?? 0),
  pass: Number(/ℹ pass (\d+)/.exec(tests.out)?.[1] ?? 0),
  fail: Number(/ℹ fail (\d+)/.exec(tests.out)?.[1] ?? 0),
};

const v1 = check("conformance · v1", "published cool-spec vectors", () =>
  run("npm", ["run", "verify:sdk"]),
);
const tee = check("conformance · TEE tier", "tamper, quote-swap, key rotation, refused channel", () =>
  run("npm", ["run", "verify:tee"]),
);
const countChecks = (text) => ({
  pass: (text.match(/\[PASS\]/g) ?? []).length,
  fail: (text.match(/\[FAIL\]/g) ?? []).length,
});

/* ── 3 · the package as a stranger sees it ────────────────────────────── */

const consumer = check("consumer install", "pack → install → run → typecheck → CLI", () =>
  run("npm", ["run", "verify:package"]),
);

/* ── 4 · dependency security ──────────────────────────────────────────── */

function audit(where, cwd) {
  const result = run("npm", ["audit", "--json"], cwd);
  // `npm audit` exits non-zero when it FINDS something, which is not a failure
  // of the run. Parse first, judge second.
  let data = null;
  try {
    data = JSON.parse(result.out);
  } catch {
    return { where, ok: false, note: "audit output was not JSON", counts: null };
  }
  const counts = data.metadata?.vulnerabilities ?? {};
  const serious = (counts.high ?? 0) + (counts.critical ?? 0);
  return {
    where,
    ok: serious === 0,
    counts,
    note: serious === 0 ? "no high or critical advisories" : `${serious} high/critical`,
  };
}

process.stdout.write("  npm audit · shipped deps … ");
const shippedAudit = auditShipped();
console.log(shippedAudit.note);

/**
 * Audit what actually ships, not what builds the website.
 *
 * The site's tree carries three.js, Next, Playwright and a decade of transitive
 * history; none of it reaches a consumer of the SDK. So the shipped dependency
 * set is installed on its own and audited on its own — that number is the one a
 * customer's security team will ask about.
 */
function auditShipped() {
  const work = join(tmpdir(), `cool-audit-${startedAt.getTime()}`);
  try {
    mkdirSync(work, { recursive: true });
    writeFileSync(
      join(work, "package.json"),
      JSON.stringify(
        { name: "cool-audit", private: true, version: "0.0.0", dependencies: pkg.dependencies },
        null,
        2,
      ),
    );
    run("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], work);
    return audit("shipped dependencies", work);
  } catch (error) {
    return { where: "shipped dependencies", ok: false, counts: null, note: String(error) };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

process.stdout.write("  npm audit · site build … ");
const siteAudit = audit("site build tree", root);
console.log(siteAudit.note);

/* ── 5 · a real evidence run, end to end ──────────────────────────────── */

process.stdout.write("  smoke · seal → verify → witness → pack … ");
const smoke = smokeTest();
console.log(smoke.ok ? "ok" : "FAILED");

/**
 * Drive the CLI the way a user does, in a directory that has never seen it, and
 * keep the artefacts it produces. This is the part of the report that is
 * evidence rather than assertion: the audit pack it writes can be re-verified by
 * anyone who receives this report.
 */
function smokeTest() {
  const work = join(tmpdir(), `cool-smoke-${startedAt.getTime()}`);
  const cli = join(root, "src", "lib", "cool", "cli", "index.ts");
  const loader = join(root, "node_modules", "tsx", "dist", "loader.mjs");
  const cool = (...args) =>
    run(process.execPath, ["--import", `file:///${loader.replace(/\\/g, "/")}`, cli, ...args], work);

  const steps = [];
  try {
    mkdirSync(work, { recursive: true });
    const seal1 = cool("seal", "prompt", "report/agent#system", "first change");
    steps.push({ step: "seal a change", ok: /sealed 0/.test(seal1.out) });

    const seal2 = cool("seal", "model", "report/agent#scorer", "v2");
    steps.push({ step: "seal a second change", ok: /sealed 0/.test(seal2.out) });

    const log = cool("log");
    steps.push({ step: "one log, two leaves", ok: /tree size\s+2/.test(log.out) });

    const verify = cool("verify", "all");
    steps.push({ step: "both verify offline", ok: verify.code === 0 });

    const witness = cool("witness", "cosign", "--key", "report-auditor");
    const afterWitness = cool("verify", "last");
    steps.push({
      step: "independent witness counted",
      ok: witness.code === 0 && /pass\s+witnesses/.test(afterWitness.out),
    });

    const strict = cool("verify", "all", "--require-hardware");
    steps.push({ step: "--require-hardware refuses simulated", ok: strict.code === 1 });

    const receipts = readdirSync(join(work, ".cool", "receipts"));
    const first = JSON.parse(readFileSync(join(work, ".cool", "receipts", receipts[0]), "utf8"));
    const disclosed = cool("disclose", first.record.record_id, "change.after", "first change");
    steps.push({ step: "selective disclosure opens one field", ok: disclosed.code === 0 });

    const wrong = cool("disclose", first.record.record_id, "change.after", "not the text");
    steps.push({ step: "a wrong disclosure is refused", ok: wrong.code === 1 });

    const packBuild = cool("pack", "build", "--out", "audit-pack.json");
    const packVerify = cool("pack", "verify", join(work, "audit-pack.json"));
    steps.push({ step: "audit pack builds and verifies", ok: packBuild.code === 0 && packVerify.code === 0 });

    // Keep the pack: a report that ships its own evidence is worth more than one
    // that describes it.
    const reports = join(root, "reports");
    mkdirSync(reports, { recursive: true });
    const packPath = join(reports, "audit-pack.json");
    writeFileSync(packPath, readFileSync(join(work, "audit-pack.json")));

    const compliance = cool("compliance");
    const covered = /(\d+) of (\d+) obligations/.exec(compliance.out);

    return {
      ok: steps.every((s) => s.ok),
      steps,
      packPath,
      obligations: covered ? `${covered[1]} of ${covered[2]}` : "—",
    };
  } catch (error) {
    return { ok: false, steps, packPath: null, obligations: "—", note: String(error) };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/* ── 6 · artefacts ────────────────────────────────────────────────────── */

let manifest = null;
try {
  manifest = JSON.parse(readFileSync(join(root, "public", "sdk", "manifest.json"), "utf8"));
} catch {
  manifest = null;
}

/* ── write it out ─────────────────────────────────────────────────────── */

const failures = results.filter((r) => !r.ok);
const overall = failures.length === 0 && smoke.ok && shippedAudit.ok;
const stamp = startedAt.toISOString().slice(0, 19).replace(/[:T]/g, "-");

const md = [
  `# CooL release report — ${pkg.name}@${pkg.version}`,
  "",
  `Generated ${startedAt.toISOString()} · node ${process.version} · ${process.platform}`,
  "",
  `**${overall ? "PASS" : "ATTENTION"}** — ${results.filter((r) => r.ok).length}/${results.length} checks green, ` +
    `${testCounts.pass}/${testCounts.total} tests, ` +
    `${smoke.ok ? "smoke clean" : "smoke FAILED"}.`,
  "",
  "## Checks",
  "",
  "| Check | What it proves | Result |",
  "|---|---|---|",
  ...results.map(
    (r) => `| ${r.name} | ${r.what} | ${r.ok ? "PASS" : `**FAIL** (exit ${r.code})`} · ${r.ms}ms |`,
  ),
  "",
  "## Tests",
  "",
  `- unit: **${testCounts.pass} passed**, ${testCounts.fail} failed, ${testCounts.total} total`,
  `- conformance v1: ${countChecks(v1.out).pass} passed, ${countChecks(v1.out).fail} failed`,
  `- conformance TEE: ${countChecks(tee.out).pass} passed, ${countChecks(tee.out).fail} failed`,
  `- consumer install: ${countChecks(consumer.out).pass} passed, ${countChecks(consumer.out).fail} failed`,
  "",
  "## Dependency audit",
  "",
  "| Tree | Vulnerabilities | Verdict |",
  "|---|---|---|",
  ...[shippedAudit, siteAudit].map((a) => {
    const c = a.counts ?? {};
    const summary = ["critical", "high", "moderate", "low"]
      .map((level) => `${c[level] ?? 0} ${level}`)
      .join(", ");
    return `| ${a.where} | ${summary} | ${a.ok ? "clean" : "**review**"} |`;
  }),
  "",
  "The shipped tree is what a consumer installs (" +
    Object.keys(pkg.dependencies ?? {}).join(", ") +
    "). The site tree includes Next, three.js and the build toolchain, none of which reach an SDK user.",
  "",
  "## Smoke test — a real evidence run",
  "",
  "| Step | Result |",
  "|---|---|",
  ...(smoke.steps ?? []).map((s) => `| ${s.step} | ${s.ok ? "PASS" : "**FAIL**"} |`),
  "",
  `Obligations covered by the evidence produced: **${smoke.obligations}**.`,
  smoke.packPath
    ? `The audit pack it produced is committed alongside this report — verify it with \`cool pack verify reports/audit-pack.json\`.`
    : "",
  "",
  "## Published artefacts",
  "",
  manifest
    ? [
        "| File | Size | SHA-256 |",
        "|---|---|---|",
        ...manifest.artefacts.map(
          (a) => `| \`${a.file}\` | ${(a.bytes / 1024).toFixed(1)} kB | \`${a.sha256}\` |`,
        ),
        "",
        `Registry: **${manifest.registry?.published ? `published as ${manifest.name}@${manifest.version}` : "not published"}**.`,
      ].join("\n")
    : "_No manifest — run `npm run sdk:build`._",
  "",
  "## Honest limits",
  "",
  "- No confidential VM has run this. Every attestation in these results is the",
  "  built-in simulator under a CooL-held root, reported as `simulated` and never",
  "  as `pass`. `--require-hardware` refuses those receipts, and the smoke test",
  "  above asserts that it does.",
  "- `anchor` is unimplemented and always reports absent.",
  "- `npm run verify:live` is the command that turns the first bullet into a",
  "  hardware result; it needs `DSTACK_ENDPOINT` and `QUOTE_VERIFIER_URL`.",
  "",
].join("\n");

const reports = join(root, "reports");
mkdirSync(reports, { recursive: true });
const mdPath = join(reports, `report-${stamp}.md`);
const jsonPath = join(reports, `report-${stamp}.json`);
writeFileSync(mdPath, `${md}\n`);
writeFileSync(
  jsonPath,
  `${JSON.stringify(
    {
      package: { name: pkg.name, version: pkg.version },
      site: { name: site.name, version: site.version },
      generated_at: startedAt.toISOString(),
      node: process.version,
      overall: overall ? "pass" : "attention",
      checks: results.map(({ name, what, ok, code, ms }) => ({ name, what, ok, code, ms })),
      tests: testCounts,
      audit: { shipped: shippedAudit, site: siteAudit },
      smoke,
      artefacts: manifest?.artefacts ?? [],
      registry: manifest?.registry ?? null,
    },
    null,
    2,
  )}\n`,
);

console.log(`\n${overall ? "PASS" : "ATTENTION"} — report written to:`);
console.log(`  ${mdPath.replace(root, ".")}`);
console.log(`  ${jsonPath.replace(root, ".")}`);
if (smoke.packPath) console.log(`  ${smoke.packPath.replace(root, ".")}  (verifiable audit pack)`);
console.log();
process.exit(overall ? 0 : 1);
