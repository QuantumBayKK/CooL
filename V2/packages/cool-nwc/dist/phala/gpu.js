import { canonicalCbor } from "../canonical.js";
import { utf8 } from "../codec.js";
import { mhSha256 } from "../multihash.js";
/**
 * The private-LLM catalogue, as published on Phala's confidential-AI endpoint.
 * Prices and context windows move; treat this as the default seed list for the
 * console's model picker, not as a price list.
 */
export const PHALA_MODELS = [
    { id: "moonshotai/kimi-k3", label: "Kimi K3", vendor: "MoonshotAI", context: 1_000_000, inputPrice: 3.0 },
    { id: "zai/glm-5.2", label: "GLM 5.2", vendor: "Z.ai", context: 1_000_000, inputPrice: 1.26 },
    { id: "qwen/qwen3.6-27b", label: "Qwen3.6 27B", vendor: "Qwen", context: 262_000, inputPrice: 0.32 },
    { id: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", vendor: "DeepSeek", context: 1_000_000, inputPrice: 0.2 },
    { id: "qwen/qwen3.5-122b-a10b", label: "Qwen3.5-122B-A10B", vendor: "Qwen", context: 262_000, inputPrice: 0.46 },
    { id: "google/gemma-4-31b", label: "Gemma 4 31B", vendor: "Google", context: 262_000, inputPrice: 0.15 },
    { id: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", vendor: "DeepSeek", context: 800_000, inputPrice: 1.5 },
    { id: "moonshotai/kimi-k2.6", label: "Kimi K2.6", vendor: "MoonshotAI", context: 262_000, inputPrice: 1.09 },
];
export const PHALA_GPUS = [
    { model: "H100", vram: "80GB", vcpu: 16, stack: "Intel TDX + NVIDIA CC", hourly: 2.4 },
    { model: "H200", vram: "141GB", vcpu: 24, stack: "Intel TDX + NVIDIA CC", hourly: 3.2 },
    { model: "B300", vram: "288GB", vcpu: 16, stack: "Intel TDX + NVIDIA CC", hourly: 5.6 },
];
/**
 * An OpenAI-compatible client for Phala's private LLM API that also collects the
 * endpoint's attestation report and reduces it to a commitment.
 *
 * The SDK deliberately makes no other outbound calls: this is the customer's own
 * model traffic, not telemetry.
 */
export class PhalaPrivateLLM {
    options;
    fetchImpl;
    cachedReport = null;
    constructor(options) {
        this.options = options;
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    }
    /** Fetch (and cache) the endpoint's attestation report for a model. */
    async attestation(model) {
        if (this.cachedReport)
            return this.cachedReport;
        const path = this.options.attestationPath ?? "/attestation/report";
        try {
            const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}${path}?model=${encodeURIComponent(model)}`, { headers: { authorization: `Bearer ${this.options.apiKey}` } });
            if (!response.ok)
                return null;
            this.cachedReport = (await response.json());
            return this.cachedReport;
        }
        catch {
            // An attestation the endpoint will not serve is reported as absent, never
            // as a failure of the inference itself.
            return null;
        }
    }
    /** Run a completion and return it with whatever attestation was available. */
    async complete(args) {
        const response = await this.fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
        });
        if (!response.ok) {
            throw new Error(`phala inference failed: HTTP ${response.status}`);
        }
        const raw = (await response.json());
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
export function gpuRefFromReport(report, gpuModel) {
    return {
        vendor: "nvidia-cc",
        gpu_model: gpuModel,
        evidence_hash: mhSha256(canonicalCbor(report)),
        // Turning this into `verified` requires an NRAS round-trip. Until that runs,
        // the record says exactly what happened: evidence collected, not yet checked.
        verdict: "unverified",
    };
}
/** A clearly-labelled GPU reference for demos, CI and local development. */
export function simulatedGpu(gpuModel, seed) {
    return {
        vendor: "nvidia-cc",
        gpu_model: gpuModel,
        evidence_hash: mhSha256(utf8(`cool-sim-nvidia-cc:${gpuModel}:${seed}`)),
        verdict: "simulated",
    };
}
//# sourceMappingURL=gpu.js.map