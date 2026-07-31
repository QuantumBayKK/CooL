/**
 * Conformance check for the vendored, browser-safe CooL SDK (`src/lib/cool`).
 *
 * `codec.ts` is the one file that deviates from upstream `cool-sdk` (Node
 * `Buffer` → `btoa`/`atob`, so it runs in a browser). This script proves the
 * deviation is byte-transparent:
 *
 *   1. a freshly minted receipt verifies on every domain it should;
 *   2. a tampered receipt fails on binding AND signature;
 *   3. the published `cool-spec` conformance vectors — produced by the
 *      upstream Node implementation — verify under this code, and the
 *      tampered vectors are rejected.
 *
 * Run with:  npm run verify:sdk
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Cool, generateKeypair, verifyReceipt } from "../src/lib/cool/index";

const VECTORS = path.join(process.cwd(), "public", "cool-vectors");

let failures = 0;
function check(label: string, pass: boolean, detail = "") {
  if (!pass) failures++;
  const mark = pass ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
}

async function roundTrip() {
  console.log("\nround-trip (mint → verify → tamper):");
  const signing = generateKeypair("conformance-key-01");
  const cool = new Cool({
    signing,
    log: "memory",
    logId: "conformance",
    backend: ({ prompt }) => ({ output: `echo:${prompt}` }),
  });

  const { receipt } = await cool.complete({
    model: "acme/credit-scorer@2026.06.0",
    prompt: "Approve loan for applicant 42?",
    params: { temperature: 0 },
  });

  const good = await verifyReceipt(receipt);
  check("fresh receipt verifies", good.ok);
  check("binding pass", good.checks.binding.status === "pass");
  check("signature pass", good.checks.signature.status === "pass");
  check("inclusion pass", good.checks.inclusion.status === "pass");
  check(
    "attestation reported mock, never pass",
    good.checks.attestation.status === "mock",
  );
  check("anchor reported absent, never pass", good.checks.anchor.status === "absent");
  check(
    "witnesses absent (self-signature not counted)",
    good.checks.witnesses.status === "absent",
  );

  // Flip one hex character of the committed output hash.
  const tampered = JSON.parse(JSON.stringify(receipt));
  const oh: string = tampered.record.response.output_hash;
  tampered.record.response.output_hash = oh.slice(0, -1) + (oh.endsWith("a") ? "b" : "a");
  const bad = await verifyReceipt(tampered);
  check("tampered receipt rejected", !bad.ok);
  check("tamper caught by binding", bad.checks.binding.status === "fail");
  check("tamper caught by signature", bad.checks.signature.status === "fail");

  // A second record must extend the same append-only tree.
  const second = await cool.complete({ model: "acme/m@1", prompt: "again" });
  const v2 = await verifyReceipt(second.receipt);
  check("second record verifies", v2.ok);
  check("tree grew to size 2", second.receipt.sth?.tree_size === 2);
}

async function vectors() {
  console.log("\ncool-spec conformance vectors (minted by upstream Node SDK):");
  for (const name of ["valid-receipt.json", "valid-receipt-with-inclusion.json"]) {
    const raw = JSON.parse(await readFile(path.join(VECTORS, name), "utf8"));
    const v = await verifyReceipt(raw);
    check(`${name} verifies`, v.ok, v.ok ? "" : v.reasons.join("; "));
  }

  const tamperedDir = path.join(VECTORS, "tampered");
  const files = (await readdir(tamperedDir)).filter((f) => f.endsWith(".json"));
  for (const name of files) {
    const raw = JSON.parse(await readFile(path.join(tamperedDir, name), "utf8"));
    const v = await verifyReceipt(raw);
    check(`tampered/${name} rejected`, !v.ok);
  }
}

async function main() {
  await roundTrip();
  await vectors();
  console.log(
    failures === 0
      ? "\nvendored SDK is conformant with upstream cool-spec.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
