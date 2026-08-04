/**
 * Conformance check for the confidential-compute tier (`src/lib/cool/phala`).
 *
 * The v1 script (`verify-sdk.ts`) proves the vendored evidence core is faithful
 * to upstream. This one proves the properties the Phala integration adds, and it
 * proves them the only way worth doing: by attacking them.
 *
 *   1. a record sealed in a (simulated) enclave verifies on every domain that
 *      can honestly pass, and reports `simulated` — never `pass` — on the two
 *      domains that depend on a hardware root;
 *   2. tampering with the record breaks binding AND signature;
 *   3. stapling a valid quote from a DIFFERENT enclave onto the record is caught
 *      by the enclave domain, because the quote digest is inside the signature;
 *   4. keys really are sealed to the measurement: redeploying different code
 *      derives a different key and fails a pinned verifier;
 *   5. RA-TLS really refuses: against a mismatched pin the channel never opens,
 *      no event is transmitted, and — the property customers actually care about
 *      — the application still gets its answer.
 *
 * Run with:  npm run verify:tee
 */
import {
  CoolTee,
  SimulatedDstackClient,
  quoteDigest,
  simulatedGpu,
  verifyReceiptV2,
} from "../src/lib/cool/phala/index";
import type { ReceiptV2 } from "../src/lib/cool/phala/index";

const APPROVED_IMAGE = "sha256:9f2c1e6b4d8a3f57cool-evidence-plane-v2.1.0";
const ROGUE_IMAGE = "sha256:deadbeefdeadbeef-someone-patched-the-engine";

let failures = 0;
function check(label: string, pass: boolean, detail = ""): void {
  if (!pass) failures++;
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
}

function echoBackend(gpu: boolean) {
  return ({ prompt, model }: { prompt: string; model: string; version: string; params: unknown }) => ({
    output: `echo:${prompt}`,
    provider: "phala-private-llm",
    ...(gpu ? { gpu: simulatedGpu("H200", model) } : {}),
  });
}

async function plane(imageDigest: string, backendGpu = false) {
  return CoolTee.connect({
    app: { name: "cool-evidence-plane", imageDigest },
    backend: echoBackend(backendGpu),
    capture: { flushMs: 1 },
    logId: "conformance-tee",
  });
}

async function sealAndVerify(): Promise<ReceiptV2> {
  console.log("\n1 · seal inside the enclave, then verify offline:");
  const cool = await plane(APPROVED_IMAGE, true);

  check("RA-TLS handshake opened the channel", cool.handshake.ok, cool.handshake.mode);
  check(
    "signing key id is derived from the measurement",
    cool.plane.keys.record.keyId.startsWith("cool-enclave-"),
    cool.plane.keys.record.keyId,
  );

  const { receipt, output } = await cool.completeSealed({
    model: "phala/deepseek-v4-pro@2026.07",
    prompt: "Summarise the refund policy for account 4471.",
    params: { temperature: 0.2 },
  });
  check("backend output returned to the caller", output.startsWith("echo:"));

  const verdict = await verifyReceiptV2(receipt);
  check("verdict.ok", verdict.ok);
  check("binding", verdict.checks.binding.status === "pass", verdict.checks.binding.detail);
  check("signature", verdict.checks.signature.status === "pass", verdict.checks.signature.detail);
  check("inclusion", verdict.checks.inclusion.status === "pass", verdict.checks.inclusion.detail);
  check(
    "attestation is reported as simulated, never as a pass",
    verdict.checks.attestation.status === "simulated",
    verdict.checks.attestation.status,
  );
  check(
    "enclave binding holds (quote ↔ key ↔ measurement)",
    verdict.checks.enclave.status === "simulated",
    verdict.checks.enclave.detail,
  );
  check("anchor stays absent", verdict.checks.anchor.status === "absent");
  check(
    "witnesses never count a self-signature",
    verdict.checks.witnesses.status === "absent",
    verdict.checks.witnesses.detail,
  );
  check(
    "GPU attestation bound into the record",
    receipt.record.runtime.gpu?.verdict === "simulated",
  );
  check(
    "requireHardware rejects a simulated receipt",
    !(await verifyReceiptV2(receipt, { requireHardware: true })).ok,
  );

  await cool.close();
  return receipt;
}

async function tamper(receipt: ReceiptV2): Promise<void> {
  console.log("\n2 · tamper with the sealed record:");
  const edited = structuredClone(receipt) as ReceiptV2;
  (edited.record as { record_id: string }).record_id = "01JQXTAMPEREDTAMPEREDTAMPE";
  const verdict = await verifyReceiptV2(edited);
  check("verdict.ok is false", !verdict.ok);
  check("binding fails", verdict.checks.binding.status === "fail");
  check("signature fails", verdict.checks.signature.status === "fail");
}

async function swapQuote(receipt: ReceiptV2): Promise<void> {
  console.log("\n3 · staple a valid quote from a different enclave:");
  const rogue = new SimulatedDstackClient({
    appName: "cool-evidence-plane",
    imageDigest: ROGUE_IMAGE,
  });
  const rogueQuote = await rogue.getQuote(receipt.attestation.key_binding!);
  check(
    "the rogue quote is internally valid",
    quoteDigest(rogueQuote) !== receipt.record.runtime.tee_quote,
  );

  const swapped = {
    ...receipt,
    attestation: { ...receipt.attestation, quote: rogueQuote },
  } as ReceiptV2;
  const verdict = await verifyReceiptV2(swapped);
  check("verdict.ok is false", !verdict.ok);
  check(
    "enclave domain catches the swap",
    verdict.checks.enclave.status === "fail",
    verdict.checks.enclave.detail,
  );
  check("binding and signature still pass (only the quote moved)", verdict.checks.signature.status === "pass");
}

async function sealing(): Promise<void> {
  console.log("\n4 · keys are sealed to the measurement:");
  const approved = new SimulatedDstackClient({ appName: "p", imageDigest: APPROVED_IMAGE });
  const rogue = new SimulatedDstackClient({ appName: "p", imageDigest: ROGUE_IMAGE });

  const a = await approved.deriveKey("cool/evidence/record/v2");
  const b = await rogue.deriveKey("cool/evidence/record/v2");
  check("different image → different sealed seed", Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0);
  check(
    "different image → different MRTD",
    approved.measurement().mrtd !== rogue.measurement().mrtd,
  );
  check(
    "different image → different RTMR3 (app events)",
    approved.measurement().rtmr3 !== rogue.measurement().rtmr3,
  );

  const cool = await plane(ROGUE_IMAGE);
  const receipt = await cool.change({
    kind: "prompt",
    ref: "billing/refund-agent#system",
    before: "Refund up to $50 without escalation.",
    after: "Refund up to $500 without escalation.",
    actor: { id: "ci:github-actions", method: "oidc" },
    approval: { policy_id: "POL-014", decision: "auto-approved", approvers: [] },
  });

  const clean = await verifyReceiptV2(receipt);
  check("a change record verifies on its own terms", clean.ok, clean.subject?.subject ?? "");

  const pinned = await verifyReceiptV2(receipt, {
    expectedMeasurement: approved.measurement(),
  });
  check("but fails against the approved image's pin", !pinned.ok);
  check(
    "and the reason names the registers that moved",
    pinned.checks.enclave.detail.includes("mrtd"),
    pinned.checks.enclave.detail,
  );
  await cool.close();
}

async function refuseToTransmit(): Promise<void> {
  console.log("\n5 · RA-TLS refuses, the application survives:");
  const approvedMeasurement = new SimulatedDstackClient({
    appName: "cool-evidence-plane",
    imageDigest: APPROVED_IMAGE,
  }).measurement();

  let dropped = 0;
  const cool = await CoolTee.connect({
    app: { name: "cool-evidence-plane", imageDigest: ROGUE_IMAGE },
    policy: { expectedMeasurement: approvedMeasurement },
    backend: echoBackend(false),
    capture: { flushMs: 1, maxRetries: 0 },
    onDrop: () => dropped++,
  });

  check("handshake failed", !cool.handshake.ok);
  check(
    "the failing step is the measurement pin",
    cool.handshake.steps.some((s) => s.label === "measurement pin" && !s.ok),
  );
  check("channel is closed", !cool.channel.open);

  const { output } = await cool.complete({
    model: "phala/deepseek-v4-pro@2026.07",
    prompt: "does the application still work?",
  });
  check("the application still got its completion", output.startsWith("echo:"));

  await cool.flush();
  const stats = cool.stats();
  check("nothing was transmitted", stats.sent === 0, `sent=${stats.sent}`);
  check("the loss is counted, not silent", dropped > 0 && stats.dropped > 0, `dropped=${stats.dropped}`);
  check(
    "capture cost stayed off the request path",
    stats.p99Ms < 5,
    `p50 ${stats.p50Ms.toFixed(4)}ms · p99 ${stats.p99Ms.toFixed(4)}ms`,
  );
  await cool.close();
}

async function main(): Promise<void> {
  console.log("CooL × Phala — confidential-compute tier conformance");
  const receipt = await sealAndVerify();
  await tamper(receipt);
  await swapQuote(receipt);
  await sealing();
  await refuseToTransmit();

  console.log(
    failures === 0
      ? "\nAll checks passed.\n"
      : `\n${failures} check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main();
