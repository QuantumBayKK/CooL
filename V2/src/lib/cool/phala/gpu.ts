/**
 * Confidential inference: proving WHICH model actually ran.
 *
 * A record that says "gpt-whatever produced this" is a claim by the caller. When
 * inference runs on a Phala confidential GPU (NVIDIA CC) or through Phala's
 * private LLM API, the serving stack can hand back an attestation of its own —
 * the GPU's evidence bundle plus the identity of the signing endpoint. Folding a
 * commitment to that bundle into the evidence record upgrades the claim into
 * something an auditor can pull on: this record was produced by a run that the
 * GPU itself attested.
 *
 * The honest limits, because they matter to anyone technical reading the output:
 *
 *   • Attestation binds the SERVING STACK, not the weights, unless the provider
 *     also publishes a weights digest. `weightsHash` is therefore optional and
 *     labelled when absent, never invented.
 *   • Verifying NVIDIA evidence means talking to NRAS. Without that round-trip
 *     the verdict is `unverified`, and the console prints it that way.
 *   • `simulatedGpu()` exists for demos and CI and says so in the record.
 */
import type { Multihash } from "../types";
import { canonicalCbor } from "../canonical";
import { utf8 } from "../codec";
import { mhSha256 } from "../multihash";
import type { GpuAttestationRef } from "./types";

/* ── catalogue ────────────────────────────────────────────────────────── */

/** A model on Phala's confidential inference endpoint. */
export interface PhalaModel {
  readonly id: string;
  readonly label: string;
  readonly vendor: string;
  /** Context window, in tokens. */
  readonly context: number;
  /** USD per million input tokens. */
  readonly inputPrice: number;
}

/**
 * The private-LLM catalogue, as published on Phala's confidential-AI endpoint.
 * Prices and context windows move; treat this as the default seed list for the
 * console's model picker, not as a price list.
 */
export const PHALA_MODELS: readonly PhalaModel[] = [
  { id: "moonshotai/kimi-k3", label: "Kimi K3", vendor: "MoonshotAI", context: 1_000_000, inputPrice: 3.0 },
  { id: "zai/glm-5.2", label: "GLM 5.2", vendor: "Z.ai", context: 1_000_000, inputPrice: 1.26 },
  { id: "qwen/qwen3.6-27b", label: "Qwen3.6 27B", vendor: "Qwen", context: 262_000, inputPrice: 0.32 },
  { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", vendor: "DeepSeek", context: 1_000_000, inputPrice: 0.2 },
  { id: "qwen/qwen3.5-122b-a10b", label: "Qwen3.5-122B-A10B", vendor: "Qwen", context: 262_000, inputPrice: 0.46 },
  { id: "google/gemma-4-31b", label: "Gemma 4 31B", vendor: "Google", context: 262_000, inputPrice: 0.15 },
  { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", vendor: "DeepSeek", context: 800_000, inputPrice: 1.5 },
  { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6", vendor: "MoonshotAI", context: 262_000, inputPrice: 1.09 },
] as const;

/** A confidential GPU shape available on Phala's marketplace. */
export interface PhalaGpu {
  readonly model: string;
  readonly vram: string;
  readonly vcpu: number;
  readonly stack: string;
  readonly hourly: number;
}

export const PHALA_GPUS: readonly PhalaGpu[] = [
  { model: "H100", vram: "80GB", vcpu: 16, stack: "Intel TDX + NVIDIA CC", hourly: 2.4 },
  { model: "H200", vram: "141GB", vcpu: 24, stack: "Intel TDX + NVIDIA CC", hourly: 3.2 },
  { model: "B300", vram: "288GB", vcpu: 16, stack: "Intel TDX + NVIDIA CC", hourly: 5.6 },
] as const;

/* ── attestation of the serving stack ─────────────────────────────────── */

/** The evidence bundle a confidential endpoint returns alongside a completion. */
export interface InferenceAttestationReport {
  /** Public key/address the endpoint signs its responses with. */
  readonly signing_address?: string;
  /** NVIDIA CC evidence (base64 / hex, provider-shaped). */
  readonly nvidia_payload?: unknown;
  /** Intel TDX quote for the CPU side of the serving VM. */
  readonly intel_quote?: unknown;
  readonly [key: string]: unknown;
}

/** Options for {@link PhalaPrivateLLM}. */
export interface PhalaLLMOptions {
  /** OpenAI-compatible base URL for Phala's confidential endpoint. */
  readonly baseUrl: string;
  readonly apiKey: string;
  /**
   * Path of the attestation report endpoint, relative to `baseUrl`. Phala has
   * moved this between releases — confirm it for your endpoint rather than
   * trusting this default.
   */
  readonly attestationPath?: string;
  /** GPU shape the endpoint runs on, recorded in the evidence record. */
  readonly gpuModel?: string;
  readonly fetchImpl?: typeof fetch;
}

/** What a confidential completion returns, ready to hand to the evidence plane. */
export interface ConfidentialCompletion {
  readonly output: string;
  readonly gpu: GpuAttestationRef | null;
  readonly weightsHash?: Multihash;
  readonly raw: unknown;
}

/**
 * An OpenAI-compatible client for Phala's private LLM API that also collects the
 * endpoint's attestation report and reduces it to a commitment.
 *
 * The SDK deliberately makes no other outbound calls: this is the customer's own
 * model traffic, not telemetry.
 */
export class PhalaPrivateLLM {
  private readonly options: PhalaLLMOptions;
  private readonly fetchImpl: typeof fetch;
  private cachedReport: InferenceAttestationReport | null = null;

  constructor(options: PhalaLLMOptions) {
    this.options = options;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  /** Fetch (and cache) the endpoint's attestation report for a model. */
  async attestation(model: string): Promise<InferenceAttestationReport | null> {
    if (this.cachedReport) return this.cachedReport;
    const path = this.options.attestationPath ?? "/attestation/report";
    try {
      const response = await this.fetchImpl(
        `${this.options.baseUrl.replace(/\/$/, "")}${path}?model=${encodeURIComponent(model)}`,
        { headers: { authorization: `Bearer ${this.options.apiKey}` } },
      );
      if (!response.ok) return null;
      this.cachedReport = (await response.json()) as InferenceAttestationReport;
      return this.cachedReport;
    } catch {
      // An attestation the endpoint will not serve is reported as absent, never
      // as a failure of the inference itself.
      return null;
    }
  }

  /** Run a completion and return it with whatever attestation was available. */
  async complete(args: {
    model: string;
    prompt: string;
    params?: Record<string, unknown>;
  }): Promise<ConfidentialCompletion> {
    const response = await this.fetchImpl(
      `${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify({
          model: args.model,
          messages: [{ role: "user", content: args.prompt }],
          ...(args.params ?? {}),
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`phala inference failed: HTTP ${response.status}`);
    }
    const raw = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const output = raw.choices?.[0]?.message?.content ?? "";
    const report = await this.attestation(args.model);
    return {
      output,
      gpu: report ? gpuRefFromReport(report, this.options.gpuModel ?? "H200") : null,
      raw,
    };
  }
}

/** Reduce a provider attestation report to the commitment stored in a record. */
export function gpuRefFromReport(
  report: InferenceAttestationReport,
  gpuModel: string,
): GpuAttestationRef {
  return {
    vendor: "nvidia-cc",
    gpu_model: gpuModel,
    evidence_hash: mhSha256(canonicalCbor(report as Record<string, unknown>)),
    // Turning this into `verified` requires an NRAS round-trip. Until that runs,
    // the record says exactly what happened: evidence collected, not yet checked.
    verdict: "unverified",
  };
}

/** A clearly-labelled GPU reference for demos, CI and local development. */
export function simulatedGpu(gpuModel: string, seed: string): GpuAttestationRef {
  return {
    vendor: "nvidia-cc",
    gpu_model: gpuModel,
    evidence_hash: mhSha256(utf8(`cool-sim-nvidia-cc:${gpuModel}:${seed}`)),
    verdict: "simulated",
  };
}
