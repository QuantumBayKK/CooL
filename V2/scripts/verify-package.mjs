/**
 * Prove the published package works *on install* — not in this repo, but in a
 * clean project that has never seen our source.
 *
 * The failure this catches is the classic one: a library that passes every test
 * in its own repository and then cannot be imported, because the exports map is
 * wrong, the emitted specifiers are extensionless, a dependency was left in
 * devDependencies, or the types resolve under `bundler` but not `nodenext`. None
 * of that is visible from inside the workspace, so this script leaves it:
 *
 *   1. pack the tarball exactly as it ships;
 *   2. install it into a throwaway project in the system temp directory;
 *   3. run it — seal a record, verify it, assert the verdict;
 *   4. typecheck a consumer file against it under BOTH `nodenext` and
 *      `bundler` module resolution, which is every mainstream setup.
 *
 * Run with:  npm run verify:package
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync, writeFileSync, readdirSync, copyFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = join(root, "packages", "cool-nwc");
const aliasDir = join(root, "packages", "alias");
const alias = JSON.parse(readFileSync(join(aliasDir, "package.json"), "utf8"));
const shell = process.platform === "win32";
// Resolve the compiler from this repo. `npx tsc` inside a throwaway directory
// fetches a squatted package of that name from the registry — a trap worth
// avoiding permanently.
const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");

let failures = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
};

const run = (command, args, cwd, quiet = true) =>
  execFileSync(command, args, {
    cwd,
    // Only npm/npx need a shell on Windows (they are .cmd shims). Running
    // node.exe through one mangles any argument containing a space — which
    // every path under "C:\Program Files" and "C:\Users\First Last" does.
    shell: shell && (command === "npm" || command === "npx"),
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });

console.log("CooL SDK — consumer install check\n");

const work = mkdtempSync(join(tmpdir(), "cool-consumer-"));
try {
  /* 1 · pack */
  console.log("packing (the package's own prepack compiles it):");
  run("npm", ["pack", "--silent"], pkgDir, false);
  const tarball = readdirSync(pkgDir).find((name) => name.endsWith(".tgz"));
  check("npm pack produced a tarball", Boolean(tarball), tarball ?? "");
  if (!tarball) process.exit(1);
  const tarballPath = join(work, tarball);
  copyFileSync(join(pkgDir, tarball), tarballPath);
  rmSync(join(pkgDir, tarball));

  /* 2 · install into a clean project */
  console.log("\ninstalling into a clean project:");
  writeFileSync(
    join(work, "package.json"),
    JSON.stringify({ name: "cool-consumer", private: true, type: "module", version: "0.0.0" }, null, 2),
  );
  run("npm", ["install", tarballPath.replace(/\\/g, "/"), "--no-audit", "--no-fund"], work);
  check("npm install <tarball> succeeded", true, work);

  /* 3 · run it */
  console.log("\nrunning it:");
  writeFileSync(
    join(work, "use.mjs"),
    `import { CoolTee, verifyReceiptV2, simulatedGpu } from "cool-nwc";

const cool = await CoolTee.connect({
  app: { name: "consumer", imageDigest: "sha256:consumer" },
  backend: ({ prompt, model }) => ({ output: "echo:" + prompt, gpu: simulatedGpu("H200", model) }),
  capture: { flushMs: 1 },
});
const { receipt } = await cool.completeSealed({ model: "m@1", prompt: "does it work on install?" });
const verdict = await verifyReceiptV2(receipt);
await cool.close();

const summary = {
  ok: verdict.ok,
  binding: verdict.checks.binding.status,
  signature: verdict.checks.signature.status,
  inclusion: verdict.checks.inclusion.status,
  attestation: verdict.checks.attestation.status,
  enclave: verdict.checks.enclave.status,
  plaintextLeaked: JSON.stringify(receipt).includes("does it work on install?"),
};
console.log(JSON.stringify(summary));
`,
  );
  const output = run("node", ["use.mjs"], work);
  const summary = JSON.parse(output.trim().split("\n").pop() ?? "{}");
  check("the record verifies", summary.ok === true, JSON.stringify(summary));
  check("binding + signature + inclusion pass",
    summary.binding === "pass" && summary.signature === "pass" && summary.inclusion === "pass");
  check("attestation is labelled, not claimed", summary.attestation === "simulated");
  check("no plaintext in the receipt", summary.plaintextLeaked === false);

  /* 4 · typecheck a consumer under both resolution modes */
  console.log("\ntypechecking a consumer:");
  writeFileSync(
    join(work, "consumer.ts"),
    `import {
  CoolTee,
  HttpDstackClient,
  remoteQuoteVerifier,
  verifyReceiptV2,
} from "cool-nwc";
import type { Measurement, ReceiptV2, VerdictV2 } from "cool-nwc";

declare const PIN: Measurement;

export async function boot(): Promise<VerdictV2> {
  const cool = await CoolTee.connect({
    dstack: new HttpDstackClient({ endpoint: "/var/run/dstack.sock", vendor: "intel-tdx" }),
    expectedMeasurement: PIN,
    policy: {
      expectedMeasurement: PIN,
      allowSimulated: false,
      requireVendor: ["intel-tdx"],
      verifier: remoteQuoteVerifier({ endpoint: "https://example.invalid", root: "intel-dcap" }),
    },
    backend: async ({ prompt }) => ({ output: prompt }),
  });
  const { receipt }: { receipt: ReceiptV2 } = await cool.completeSealed({ model: "m@1", prompt: "p" });
  await cool.close();
  return verifyReceiptV2(receipt, { requireHardware: true, expectedMeasurement: PIN });
}
`,
  );

  for (const moduleResolution of ["nodenext", "bundler"]) {
    writeFileSync(
      join(work, `tsconfig.${moduleResolution}.json`),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            lib: ["ES2022", "DOM"],
            module: moduleResolution === "nodenext" ? "nodenext" : "esnext",
            moduleResolution,
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            types: [],
          },
          files: ["consumer.ts"],
        },
        null,
        2,
      ),
    );
    try {
      run(process.execPath, [tsc, "-p", `tsconfig.${moduleResolution}.json`], work);
      check(`types resolve under moduleResolution: ${moduleResolution}`, true);
    } catch (error) {
      check(
        `types resolve under moduleResolution: ${moduleResolution}`,
        false,
        String(error.stdout ?? error.message).split("\n").slice(0, 4).join(" | "),
      );
    }
  }

  /* 5 · the subpath exports */
  console.log("\nsubpath exports:");
  writeFileSync(
    join(work, "subpaths.mjs"),
    `import { CoolTee } from "cool-nwc/phala";
import { Cool, verifyReceipt } from "cool-nwc/v1";
console.log(JSON.stringify({
  phala: typeof CoolTee === "function",
  v1: typeof Cool === "function" && typeof verifyReceipt === "function",
}));
`,
  );
  const subpaths = JSON.parse(run("node", ["subpaths.mjs"], work).trim().split("\n").pop() ?? "{}");
  check("'/phala' entry point resolves", subpaths.phala === true);
  check("'/v1' entry point resolves", subpaths.v1 === true);

  /* 6 · the `cool` command a global install puts on PATH */
  console.log("\nthe cool command:");
  const bin = join(work, "node_modules", "cool-nwc", "dist", "cli", "index.js");
  const version = run(process.execPath, [bin, "--version"], work).trim();
  check("`cool --version` answers", /^\d+\.\d+\.\d+$/.test(version), version);
  check(
    "`cool --help` lists the commands",
    run(process.execPath, [bin, "--help"], work).includes("walkthrough"),
  );

  const sealed = run(process.execPath, [bin, "seal", "prompt", "pkg#system", "installed"], work);
  check("`cool seal` writes a receipt", /sealed 0[0-9A-HJKMNP-TV-Z]{25}/.test(sealed));
  const verified = run(process.execPath, [bin, "verify", "last"], work);
  check("`cool verify last` accepts it", verified.includes("receipt verifies"));
  check("and labels the simulated attestation", verified.includes("simulated"));

  /* 7 · the alias — a re-export can silently export nothing */
  console.log("\nthe alias package:");
  run("npm", ["pack", "--silent"], aliasDir, false);
  const aliasTarball = readdirSync(aliasDir).find((name) => name.endsWith(".tgz"));
  check("alias packs", Boolean(aliasTarball), aliasTarball ?? "");
  if (aliasTarball) {
    const aliasPath = join(work, aliasTarball);
    copyFileSync(join(aliasDir, aliasTarball), aliasPath);
    rmSync(join(aliasDir, aliasTarball));
    run("npm", ["install", aliasPath.replace(/\\/g, "/"), "--no-audit", "--no-fund"], work);

    writeFileSync(
      join(work, "alias.mjs"),
      `import * as root from "${alias.name}";
import * as phala from "${alias.name}/phala";
import * as v1 from "${alias.name}/v1";
console.log(JSON.stringify({
  exports: Object.keys(root).length,
  cool: typeof root.CoolTee,
  verify: typeof root.verifyReceiptV2,
  phala: typeof phala.CoolTee,
  v1: typeof v1.Cool,
}));
`,
    );
    const aliasOut = JSON.parse(run(process.execPath, ["alias.mjs"], work).trim().split("\n").pop() ?? "{}");
    // The failure this exists for: a self-referential re-export resolves to an
    // empty namespace — types and all — and only surfaces at someone's import.
    check("alias re-exports the library", aliasOut.exports > 10, `${aliasOut.exports} exports`);
    check("alias exposes CoolTee", aliasOut.cool === "function");
    check("alias exposes verifyReceiptV2", aliasOut.verify === "function");
    check("alias '/phala' resolves", aliasOut.phala === "function");
    check("alias '/v1' resolves", aliasOut.v1 === "function");
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(failures === 0 ? "\nThe published package works on install.\n" : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
