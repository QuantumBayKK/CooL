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
import type { Multihash } from "../types.js";
import type { GpuAttestationRef } from "./types.js";
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
export declare const PHALA_MODELS: readonly PhalaModel[];
/** A confidential GPU shape available on Phala's marketplace. */
export interface PhalaGpu {
    readonly model: string;
    readonly vram: string;
    readonly vcpu: number;
    readonly stack: string;
    readonly hourly: number;
}
export declare const PHALA_GPUS: readonly PhalaGpu[];
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
export declare class PhalaPrivateLLM {
    private readonly options;
    private readonly fetchImpl;
    private cachedReport;
    constructor(options: PhalaLLMOptions);
    /** Fetch (and cache) the endpoint's attestation report for a model. */
    attestation(model: string): Promise<InferenceAttestationReport | null>;
    /** Run a completion and return it with whatever attestation was available. */
    complete(args: {
        model: string;
        prompt: string;
        params?: Record<string, unknown>;
    }): Promise<ConfidentialCompletion>;
}
/** Reduce a provider attestation report to the commitment stored in a record. */
export declare function gpuRefFromReport(report: InferenceAttestationReport, gpuModel: string): GpuAttestationRef;
/** A clearly-labelled GPU reference for demos, CI and local development. */
export declare function simulatedGpu(gpuModel: string, seed: string): GpuAttestationRef;
