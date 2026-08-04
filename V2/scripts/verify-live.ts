/**
 * Point the SDK at the real thing.
 *
 * Every other check in this repository runs against the simulator or against
 * mock services. This one runs against actual endpoints — a dstack guest agent
 * inside a confidential VM, an attestation service that speaks to Intel, and
 * Phala's confidential inference API — and it is the script that will turn
 * `attestation: simulated` into `attestation: pass` on real silicon for the
 * first time.
 *
 * It is deliberately a separate command rather than part of `npm test`, because
 * it needs credentials and a deployed CVM. Nothing here is stubbed: if an
 * endpoint is not configured, that section is skipped and says so, so the output
 * can never be mistaken for a pass it did not earn.
 *
 * Run inside the CVM (or with the endpoints reachable):
 *
 *   DSTACK_ENDPOINT=/var/run/dstack.sock \
 *   QUOTE_VERIFIER_URL=https://... \
 *   PHALA_LLM_URL=https://api.phala.network/v1 PHALA_API_KEY=... \
 *   COOL_PIN_MRTD=... COOL_PIN_RTMR0=... (optional) \
 *   npm run verify:live
 */
import {
  CoolTee,
  HttpDstackClient,
  PhalaPrivateLLM,
  remoteQuoteVerifier,
  verifyReceiptV2,
} from "../src/lib/cool/phala/index";
import type { Measurement } from "../src/lib/cool/phala/index";

const env = (name: string): string | undefined => {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
};

let failures = 0;
let skipped = 0;

function check(label: string, ok: boolean, detail = ""): void {
  if (!ok) failures++;
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
}

function skip(section: string, reason: string): void {
  skipped++;
  console.log(`  [SKIP] ${section} — ${reason}`);
}

/** The measurement to pin, if the operator supplied one. */
function pin(): Measurement | undefined {
  const mrtd = env("COOL_PIN_MRTD");
  if (!mrtd) return undefined;
  const hex = (value: string | undefined): `hex:${string}` =>
    `hex:${(value ?? "").replace(/^0x/, "").toLowerCase()}`;
  return {
    mrtd: hex(mrtd),
    rtmr0: hex(env("COOL_PIN_RTMR0")),
    rtmr1: hex(env("COOL_PIN_RTMR1")),
    rtmr2: hex(env("COOL_PIN_RTMR2")),
    rtmr3: hex(env("COOL_PIN_RTMR3")),
  };
}

async function dstackSection(): Promise<void> {
  console.log("\n1 · dstack guest agent (real CVM):");
  const endpoint = env("DSTACK_ENDPOINT");
  if (!endpoint) {
    skip("dstack", "set DSTACK_ENDPOINT to the guest agent (http URL or socket proxy)");
    return;
  }

  const client = new HttpDstackClient({
    endpoint,
    vendor: (env("DSTACK_VENDOR") as "intel-tdx" | "amd-sev-snp" | undefined) ?? "intel-tdx",
    ...(env("DSTACK_INFO_METHOD") === "POST" ? { infoMethod: "POST" as const } : {}),
    ...(env("DSTACK_PATH_INFO") || env("DSTACK_PATH_QUOTE") || env("DSTACK_PATH_KEY")
      ? {
          paths: {
            ...(env("DSTACK_PATH_INFO") ? { info: env("DSTACK_PATH_INFO")! } : {}),
            ...(env("DSTACK_PATH_QUOTE") ? { quote: env("DSTACK_PATH_QUOTE")! } : {}),
            ...(env("DSTACK_PATH_KEY") ? { key: env("DSTACK_PATH_KEY")! } : {}),
          },
        }
      : {}),
  });

  const info = await client.info();
  check("info() answered", Boolean(info.appId), `app ${info.appId} · instance ${info.instanceId}`);
  check("MRTD is present", info.measurement.mrtd.length > 5, info.measurement.mrtd.slice(0, 26));
  console.log(`         mrtd  ${info.measurement.mrtd.slice(4)}`);
  console.log(`         rtmr3 ${info.measurement.rtmr3.slice(4)}`);

  const seed = await client.deriveKey("cool/evidence/record/v2");
  check("dstack-KMS returned a sealed seed", seed.length === 32, `${seed.length} bytes`);

  const verifierUrl = env("QUOTE_VERIFIER_URL");
  const verifier = verifierUrl
    ? remoteQuoteVerifier({
        endpoint: verifierUrl,
        root: (env("QUOTE_ROOT") as "intel-dcap") ?? "intel-dcap",
        ...(env("QUOTE_VERIFIER_KEY")
          ? { headers: { authorization: `Bearer ${env("QUOTE_VERIFIER_KEY")}` } }
          : {}),
      })
    : undefined;

  const measurement = pin();
  const cool = await CoolTee.connect({
    dstack: client,
    ...(measurement ? { expectedMeasurement: measurement } : {}),
    policy: {
      allowSimulated: false,
      ...(measurement ? { expectedMeasurement: measurement } : {}),
      ...(verifier ? { verifier } : { requireVerifiedRoot: false }),
    },
    backend: ({ prompt }) => ({ output: `live-check:${prompt}` }),
    capture: { flushMs: 1 },
  });

  for (const step of cool.handshake.steps) {
    console.log(`         ${step.ok ? "✓" : "✗"} ${step.label.padEnd(16)} ${step.detail}`);
  }
  check("RA-TLS handshake", cool.handshake.ok, cool.handshake.reasons.join("; "));

  const { receipt } = await cool.completeSealed({
    model: "live/verification@1",
    prompt: "verify-live",
  });
  const verdict = await verifyReceiptV2(receipt, {
    ...(verifier ? { quoteVerifier: verifier } : {}),
    ...(measurement ? { expectedMeasurement: measurement } : {}),
  });

  for (const [domain, result] of Object.entries(verdict.checks)) {
    console.log(`         ${domain.padEnd(12)} ${result.status.padEnd(10)} ${result.detail}`);
  }
  check("record verifies", verdict.ok, verdict.reasons.join("; "));
  check(
    "runtime mode is hardware",
    receipt.record.runtime.mode === "hardware",
    receipt.record.runtime.mode,
  );

  if (verifier) {
    check(
      "attestation PASSES against a vendor root",
      verdict.checks.attestation.status === "pass",
      verdict.checks.attestation.detail,
    );
    check(
      "enclave binding PASSES",
      verdict.checks.enclave.status === "pass",
      verdict.checks.enclave.detail,
    );
    check(
      "requireHardware accepts this receipt",
      (await verifyReceiptV2(receipt, { quoteVerifier: verifier, requireHardware: true })).ok,
    );
  } else {
    skip("vendor-root verification", "set QUOTE_VERIFIER_URL to chain the quote to Intel/AMD");
  }

  await cool.close();
}

async function inferenceSection(): Promise<void> {
  console.log("\n2 · Phala confidential inference:");
  const baseUrl = env("PHALA_LLM_URL");
  const apiKey = env("PHALA_API_KEY");
  if (!baseUrl || !apiKey) {
    skip("private LLM", "set PHALA_LLM_URL and PHALA_API_KEY");
    return;
  }

  const llm = new PhalaPrivateLLM({
    baseUrl,
    apiKey,
    gpuModel: env("PHALA_GPU") ?? "H200",
    ...(env("PHALA_ATTESTATION_PATH") ? { attestationPath: env("PHALA_ATTESTATION_PATH")! } : {}),
  });

  const model = env("PHALA_MODEL") ?? "deepseek/deepseek-v4-pro";
  const report = await llm.attestation(model);
  check("attestation report served", report !== null, report ? "present" : "endpoint served none");

  const completion = await llm.complete({
    model,
    prompt: "Reply with the single word: acknowledged.",
    params: { max_tokens: 16, temperature: 0 },
  });
  check("completion returned", completion.output.length > 0, completion.output.slice(0, 60));
  check(
    "GPU evidence committed",
    completion.gpu !== null,
    completion.gpu ? `${completion.gpu.gpu_model} · ${completion.gpu.evidence_hash}` : "none",
  );
}

async function main(): Promise<void> {
  console.log("CooL — live endpoint verification");
  console.log("Nothing below is simulated. Unconfigured sections are skipped, never faked.");

  try {
    await dstackSection();
  } catch (error) {
    failures++;
    console.log(`  [FAIL] dstack section threw — ${(error as Error).message}`);
  }

  try {
    await inferenceSection();
  } catch (error) {
    failures++;
    console.log(`  [FAIL] inference section threw — ${(error as Error).message}`);
  }

  console.log(
    failures === 0
      ? `\nAll live checks passed${skipped > 0 ? ` (${skipped} section(s) skipped)` : ""}.\n`
      : `\n${failures} live check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main();
