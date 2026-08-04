/**
 * The `Cool` client: turn one model call into a signed, self-verifying receipt.
 * Vendored from `cool-sdk`.
 *
 * What this proves: each receipt produced here commits to the exact model id,
 * the salted hashes of the input and output, the parameters, and the time, and
 * seals that commitment with a hybrid (post-quantum + classical) signature. With
 * `log: "memory"` it also produces a real RFC 6962 inclusion proof and STH.
 * What this does NOT prove: that the output is correct, fair, unbiased, safe, or
 * policy-compliant; that any real TEE attested the run (runtime mode is always
 * `mock`); or that the record was independently witnessed or anchored.
 *
 * The SDK makes NO network calls of its own — the only outbound call is the
 * `backend` you supply. There is no telemetry.
 */
import { ulid } from "ulid";
import { canonicalCbor } from "./canonical.js";
import { utf8 } from "./codec.js";
import { mhSha256 } from "./multihash.js";
import { randomSalt, saltedCommit } from "./hash.js";
import { generateKeypair, mergeDirectories } from "./keys.js";
import { hybridSign } from "./sign.js";
import { MemoryLog } from "./log-memory.js";
import { bindingHash, recordLeafData, recordSigningMessage } from "./record.js";
const ATTESTATION = { mode: "mock", note: "no hardware quote in v0" };
function parseModelRef(ref) {
    const at = ref.lastIndexOf("@");
    if (at <= 0)
        return { id: ref, version: "0" };
    return { id: ref.slice(0, at), version: ref.slice(at + 1) };
}
/** Labelled mock weights commitment, used when a backend supplies none. */
function mockWeightsHash(id, version) {
    return mhSha256(utf8(`cool-mock-weights:${id}@${version}`));
}
/**
 * A CooL client bound to a signing key and a model backend. Reusable across
 * many `complete()` calls; `seq` increments per record within one instance.
 */
export class Cool {
    signing;
    backend;
    logMode;
    logKey;
    memlog;
    provider;
    clock;
    newId;
    newSalt;
    nextSeq;
    constructor(options) {
        this.signing = options.signing;
        this.backend = options.backend;
        this.logMode = options.log ?? "none";
        this.provider = options.provider ?? "mock-local";
        this.clock = options.clock ?? (() => new Date().toISOString());
        this.newId = options.newId ?? (() => ulid());
        this.newSalt = options.newSalt ?? (() => randomSalt());
        let counter = 0;
        this.nextSeq = options.seq ?? (() => counter++);
        if (this.logMode === "memory") {
            const logId = options.logId ?? "demo";
            this.logKey = options.logKey ?? generateKeypair(`cool-log-${logId}-01`);
            this.memlog = new MemoryLog(logId, this.logKey);
        }
        else {
            this.logKey = null;
            this.memlog = null;
        }
    }
    /** Entries currently in this client's in-memory transparency log. */
    get logSize() {
        return this.memlog?.size ?? 0;
    }
    /**
     * Run the backend and produce a signed receipt for the call.
     * Proves what was computed and that the record is unforged; proves nothing
     * about the quality or safety of the output.
     */
    async complete(request) {
        const { id, version } = parseModelRef(request.model);
        const params = request.params ?? {};
        const result = await this.backend({ model: id, version, prompt: request.prompt, params });
        const output = result.output;
        const inputSalt = this.newSalt();
        const outputSalt = this.newSalt();
        const core = {
            schema: "cool.inference.v1",
            record_id: this.newId(),
            time: { issued_at: this.clock(), seq: this.nextSeq() },
            model: {
                id,
                version,
                weights_hash: result.weightsHash ?? mockWeightsHash(id, version),
                provider: this.provider,
            },
            request: {
                input_hash: saltedCommit(inputSalt, request.prompt),
                input_salt: inputSalt,
                params_hash: mhSha256(canonicalCbor(params)),
            },
            response: {
                output_hash: saltedCommit(outputSalt, output),
                output_salt: outputSalt,
            },
            runtime: { tee_vendor: "none", mode: "mock", enclave_measurement: null, tee_quote: null },
        };
        const binding = bindingHash(core);
        const signature = hybridSign(recordSigningMessage(core, binding), this.signing);
        const record = { ...core, signature };
        let inclusion = null;
        let sth = null;
        if (this.memlog) {
            const { leafIndex } = this.memlog.append(recordLeafData(binding));
            sth = this.memlog.buildSTH(this.clock());
            inclusion = {
                leaf_index: leafIndex,
                tree_size: sth.tree_size,
                audit_path: this.memlog.inclusionAuditPath(leafIndex),
            };
        }
        const directoryKeys = this.logKey ? [this.signing, this.logKey] : [this.signing];
        const key_directory = mergeDirectories(...directoryKeys);
        const receipt = {
            schema: "cool.receipt.v1",
            record,
            binding_hash: binding,
            inclusion,
            sth,
            attestation: ATTESTATION,
            anchor: null,
            key_directory,
        };
        return { output, receipt };
    }
}
//# sourceMappingURL=cool.js.map