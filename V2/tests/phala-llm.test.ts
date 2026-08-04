/**
 * `PhalaPrivateLLM` — confidential inference and the evidence it yields.
 *
 * Two things are being pinned here. The first is ordinary: an OpenAI-compatible
 * call, its error handling, and the fact that the attestation report is fetched
 * once rather than per request. The second matters more — the evidence must
 * degrade honestly. An endpoint that serves completions but not attestations is
 * common (self-hosted, older builds, a misconfigured proxy), and the correct
 * behaviour is a record that says "no GPU attestation", never one that implies
 * a confidential GPU because the model name looked right.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { canonicalCbor } from "../src/lib/cool/canonical";
import { mhSha256 } from "../src/lib/cool/multihash";
import {
  CoolTee,
  PhalaPrivateLLM,
  gpuRefFromReport,
  verifyReceiptV2,
} from "../src/lib/cool/phala/index";
import { startMockPhalaLLM } from "./support/servers";

test("a completion carries the endpoint's attestation as a commitment", async () => {
  const llm = await startMockPhalaLLM();
  try {
    const client = new PhalaPrivateLLM({
      baseUrl: `${llm.url}`,
      apiKey: "test-key",
      gpuModel: "H200",
    });
    const result = await client.complete({
      model: "deepseek/deepseek-v4-pro",
      prompt: "assess application A-40182",
      params: { temperature: 0.2 },
    });

    assert.equal(result.output, "Score 62/100. Decline.");
    assert.equal(result.gpu?.vendor, "nvidia-cc");
    assert.equal(result.gpu?.gpu_model, "H200");
    assert.equal(result.gpu?.verdict, "unverified", "no NRAS round-trip happened, so say so");

    // The commitment must be recomputable from the report by anyone.
    const report = {
      signing_address: "0x9f2c1e6b4d8a3f57c0b1e2d3a4f5968708192a3b",
      nvidia_payload: { evidence: "AgABAL8LAAAMAAsA", gpu: "H200" },
      intel_quote: "0400020081000000",
    };
    assert.equal(result.gpu?.evidence_hash, mhSha256(canonicalCbor(report)));
    assert.equal(result.gpu?.evidence_hash, gpuRefFromReport(report, "H200").evidence_hash);

    // The authorization header and the model must have reached the endpoint.
    const call = llm.calls.find((c) => c.path === "/chat/completions");
    assert.equal((call?.body as { model: string }).model, "deepseek/deepseek-v4-pro");
    assert.equal((call?.body as { temperature: number }).temperature, 0.2);
  } finally {
    await llm.close();
  }
});

test("the attestation report is fetched once, not per request", async () => {
  const llm = await startMockPhalaLLM();
  try {
    const client = new PhalaPrivateLLM({ baseUrl: llm.url, apiKey: "k" });
    await client.complete({ model: "m", prompt: "one" });
    await client.complete({ model: "m", prompt: "two" });
    const reports = llm.calls.filter((c) => c.path === "/attestation/report");
    assert.equal(reports.length, 1);
  } finally {
    await llm.close();
  }
});

test("an endpoint without attestation still serves, and the record admits it", async () => {
  const llm = await startMockPhalaLLM({ withAttestation: false });
  try {
    const client = new PhalaPrivateLLM({ baseUrl: llm.url, apiKey: "k" });
    const result = await client.complete({ model: "m", prompt: "p" });
    assert.equal(result.gpu, null, "no attestation must mean no GPU claim");

    const cool = await CoolTee.connect({
      app: { name: "llm", imageDigest: "sha256:llm" },
      backend: async ({ model, prompt }) => {
        const completion = await client.complete({ model, prompt });
        return completion.gpu
          ? { output: completion.output, gpu: completion.gpu }
          : { output: completion.output };
      },
      capture: { flushMs: 1 },
    });
    const { receipt } = await cool.completeSealed({ model: "m@1", prompt: "p" });
    assert.equal(receipt.record.runtime.gpu, null);
    assert.equal((await verifyReceiptV2(receipt)).ok, true);
    await cool.close();
  } finally {
    await llm.close();
  }
});

test("an upstream failure surfaces rather than producing an empty record", async () => {
  const llm = await startMockPhalaLLM({ completionStatus: 500 });
  try {
    const client = new PhalaPrivateLLM({ baseUrl: llm.url, apiKey: "k" });
    await assert.rejects(() => client.complete({ model: "m", prompt: "p" }), /HTTP 500/);
  } finally {
    await llm.close();
  }
});

test("a GPU-attested completion binds into the signed record", async () => {
  const llm = await startMockPhalaLLM();
  try {
    const client = new PhalaPrivateLLM({ baseUrl: llm.url, apiKey: "k", gpuModel: "B300" });
    const cool = await CoolTee.connect({
      app: { name: "llm", imageDigest: "sha256:llm" },
      backend: async ({ model, prompt }) => {
        const completion = await client.complete({ model, prompt });
        return completion.gpu
          ? { output: completion.output, gpu: completion.gpu, provider: "phala-private-llm" }
          : { output: completion.output, provider: "phala-private-llm" };
      },
      capture: { flushMs: 1 },
    });

    const { receipt } = await cool.completeSealed({
      model: "phala/deepseek-v4-pro@2026.07",
      prompt: "p",
    });
    assert.equal(receipt.record.runtime.gpu?.gpu_model, "B300");
    assert.equal(receipt.record.schema, "cool.inference.v2");

    const verdict = await verifyReceiptV2(receipt);
    assert.equal(verdict.ok, true);

    // Editing the GPU block after the fact must break the signature — the whole
    // reason it lives inside the signed core.
    const forged = JSON.parse(JSON.stringify(receipt)) as typeof receipt;
    (forged.record.runtime.gpu as { verdict: string }).verdict = "verified";
    const tampered = await verifyReceiptV2(forged);
    assert.equal(tampered.checks.binding.status, "fail");
    assert.equal(tampered.checks.signature.status, "fail");

    await cool.close();
  } finally {
    await llm.close();
  }
});
