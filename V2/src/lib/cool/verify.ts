/**
 * The shared, offline verification core for CooL receipts.
 * Vendored from `cool-sdk` — this is the SAME algorithm the published
 * `cool-verifier` CLI runs, executing here in the visitor's browser.
 *
 * What this proves (when `ok` is true): the record's contents match its binding
 * commitment, BOTH hybrid signatures verify against the embedded public key, and
 * — if a transparency-log proof is present — the leaf is included under a
 * validly signed STH. In short: the operator could not have forged or silently
 * edited this record.
 * What this does NOT prove: that the output is correct, fair, unbiased, safe, or
 * policy-compliant; that any independent witness saw it; or that it was anchored
 * to a public chain. Those domains are reported honestly as mock/absent and
 * NEVER as a pass.
 */
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import type {
  DomainCheck,
  Receipt,
  Verdict,
  VerdictChecks,
  VerdictSubject,
  VerifyOptions,
} from "./types";
import { RECEIPT_SCHEMA } from "./schema";
import { multihashDigest } from "./multihash";
import { hybridVerify } from "./sign";
import { leafHash, verifyInclusion } from "./merkle";
import {
  bindingHash,
  coreOf,
  recordLeafData,
  recordSigningMessage,
  sthCore,
  sthSigningMessage,
} from "./record";

const ATTESTATION_DETAIL = "MOCK — no hardware quote present (planned)";
const ANCHOR_DETAIL = "NONE — not anchored to a public chain (planned)";

/**
 * Compile the schema lazily and once.
 *
 * The upstream SDK compiles at module load. Here the module is pulled into a
 * lazily-imported client chunk, and compiling on first use keeps that chunk's
 * evaluation cheap — the deck can load without paying for the verifier until
 * someone actually runs the demo.
 */
let validateReceipt: ValidateFunction | null = null;
function receiptValidator(): ValidateFunction {
  if (!validateReceipt) {
    const ajv = new Ajv2020({ strict: false, allErrors: true, logger: false });
    validateReceipt = ajv.compile(RECEIPT_SCHEMA);
  }
  return validateReceipt;
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) return ["receipt does not conform to cool.receipt.v1"];
  return errors.map((e) => `schema: ${e.instancePath || "(root)"} ${e.message ?? "invalid"}`.trim());
}

/** Build the verdict returned when a receipt fails structural (schema) validation. */
function formatFailureVerdict(reasons: string[]): Verdict {
  const fail: DomainCheck = {
    status: "fail",
    detail: "receipt failed cool.receipt.v1 schema validation",
  };
  const absent: DomainCheck = { status: "absent", detail: "not evaluated — receipt is malformed" };
  return {
    ok: false,
    schema: "cool.receipt.v1",
    subject: null,
    checks: {
      binding: fail,
      signature: fail,
      inclusion: absent,
      witnesses: absent,
      attestation: { status: "mock", detail: ATTESTATION_DETAIL },
      anchor: { status: "absent", detail: ANCHOR_DETAIL },
    },
    reasons,
  };
}

/**
 * Verify a CooL receipt fully offline against the keys it carries.
 * Returns a structured {@link Verdict} — never a bare boolean. Never throws
 * on a malformed or tampered receipt; problems surface as failed domains.
 */
export async function verifyReceipt(
  receipt: unknown,
  options: VerifyOptions = {},
): Promise<Verdict> {
  const witnessThreshold = options.witnessThreshold ?? 0;
  const validate = receiptValidator();

  // Step 1 — parse + JSON-Schema validation.
  if (!validate(receipt)) {
    return formatFailureVerdict(formatAjvErrors(validate.errors));
  }
  const r = receipt as Receipt;
  const reasons: string[] = [];

  const subject: VerdictSubject = {
    model: r.record.model.id,
    version: r.record.model.version,
    issued_at: r.record.time.issued_at,
    record_id: r.record.record_id,
    key_id: r.record.signature.key_id,
  };

  // Step 2 — binding: recompute mh(canonicalCBOR(core)) and compare.
  const core = coreOf(r.record);
  const recomputedBinding = bindingHash(core);
  const bindingOk = recomputedBinding === r.binding_hash;
  const binding: DomainCheck = bindingOk
    ? { status: "pass", detail: "recomputed from record, matches" }
    : {
        status: "fail",
        detail: `FAILED — recomputed ${recomputedBinding} ≠ stored ${r.binding_hash}`,
      };
  if (!bindingOk) reasons.push("binding: recomputed binding_hash does not match the receipt");

  // Step 3 — signature: BOTH ML-DSA-65 and Ed25519 over core ‖ binding_hash.
  const sigKeyId = r.record.signature.key_id;
  const sigEntry = r.key_directory[sigKeyId];
  let signature: DomainCheck;
  if (!sigEntry) {
    signature = {
      status: "fail",
      detail: `FAILED — no public key for key_id '${sigKeyId}' in key_directory`,
    };
    reasons.push(`signature: key_directory has no entry for '${sigKeyId}'`);
  } else {
    const message = recordSigningMessage(core, r.binding_hash);
    const result = hybridVerify(message, r.record.signature, sigEntry);
    if (result.ok) {
      signature = { status: "pass", detail: `ML-DSA-65 + Ed25519 valid (key ${sigKeyId})` };
    } else {
      const both = !result.mlDsaOk && !result.ed25519Ok;
      const which = both ? "ML-DSA-65 and Ed25519" : !result.mlDsaOk ? "ML-DSA-65" : "Ed25519";
      const verb = both ? "do not verify" : "does not verify";
      signature = { status: "fail", detail: `FAILED — ${which} ${verb} over core‖binding_hash` };
      reasons.push(`signature: ${which} ${verb} (record altered or wrong key)`);
    }
  }

  // Step 4 — inclusion (only if a transparency-log proof is present).
  let inclusion: DomainCheck;
  if (r.inclusion && r.sth) {
    inclusion = verifyInclusionDomain(r, reasons);
  } else if (!r.inclusion && !r.sth) {
    inclusion = { status: "absent", detail: "absent (no transparency-log proof in this receipt)" };
  } else {
    inclusion = {
      status: "fail",
      detail: "FAILED — inclusion and sth must both be present or both absent",
    };
    reasons.push("inclusion: receipt has only one of {inclusion, sth}");
  }

  // Step 5 — witnesses: count only external:true valid co-signatures.
  const witnesses = verifyWitnessesDomain(r, witnessThreshold);

  // Step 6 — attestation: MOCK in this build, NEVER a pass.
  const attestation: DomainCheck = { status: "mock", detail: ATTESTATION_DETAIL };

  // Step 7 — anchor: ABSENT in this build, NEVER a pass.
  const anchor: DomainCheck = { status: "absent", detail: ANCHOR_DETAIL };

  const checks: VerdictChecks = {
    binding,
    signature,
    inclusion,
    witnesses,
    attestation,
    anchor,
  };

  // Step 8 — ok requires binding + signature pass and inclusion pass-or-absent.
  const inclusionAcceptable = inclusion.status === "pass" || inclusion.status === "absent";
  const ok = binding.status === "pass" && signature.status === "pass" && inclusionAcceptable;

  return { ok, schema: "cool.receipt.v1", subject, checks, reasons };
}

function verifyInclusionDomain(r: Receipt, reasons: string[]): DomainCheck {
  const inc = r.inclusion!;
  const sth = r.sth!;

  if (inc.tree_size !== sth.tree_size) {
    reasons.push("inclusion: inclusion.tree_size does not match sth.tree_size");
    return {
      status: "fail",
      detail: `FAILED — inclusion tree_size ${inc.tree_size} ≠ STH tree_size ${sth.tree_size}`,
    };
  }
  if (inc.leaf_index < 0 || inc.leaf_index >= sth.tree_size) {
    reasons.push("inclusion: leaf_index out of range for tree_size");
    return {
      status: "fail",
      detail: `FAILED — leaf_index ${inc.leaf_index} out of range for tree(${sth.tree_size})`,
    };
  }

  let auditPath: Uint8Array[];
  let expectedRoot: Uint8Array;
  let leafHashValue: Uint8Array;
  try {
    auditPath = inc.audit_path.map(multihashDigest);
    expectedRoot = multihashDigest(sth.root_hash);
    // The leaf is the binding digest; its RFC 6962 leaf hash starts the walk.
    leafHashValue = leafHash(recordLeafData(r.binding_hash));
  } catch {
    reasons.push("inclusion: malformed audit path or root hash");
    return { status: "fail", detail: "FAILED — malformed audit path or STH root hash" };
  }

  const rootOk = verifyInclusion(
    leafHashValue,
    inc.leaf_index,
    sth.tree_size,
    auditPath,
    expectedRoot,
  );
  if (!rootOk) {
    reasons.push("inclusion: audit path does not reconstruct the STH root");
    return { status: "fail", detail: "FAILED — audit path does not reconstruct STH root" };
  }

  // STH signature must verify against the log key carried in the directory.
  const sthEntry = r.key_directory[sth.signature.key_id];
  if (!sthEntry) {
    reasons.push(`inclusion: key_directory has no entry for STH key '${sth.signature.key_id}'`);
    return {
      status: "fail",
      detail: `FAILED — no public key for STH key_id '${sth.signature.key_id}'`,
    };
  }
  const sthSigOk = hybridVerify(sthSigningMessage(sthCore(sth)), sth.signature, sthEntry).ok;
  if (!sthSigOk) {
    reasons.push("inclusion: STH signature does not verify");
    return { status: "fail", detail: "FAILED — STH signature invalid" };
  }

  return {
    status: "pass",
    detail: `leaf ${inc.leaf_index} ∈ tree(${sth.tree_size}); STH signature valid`,
  };
}

function verifyWitnessesDomain(r: Receipt, threshold: number): DomainCheck {
  if (!r.sth) {
    return { status: "absent", detail: "no STH (transparency-log proof absent)" };
  }
  const message = sthSigningMessage(sthCore(r.sth));
  let externalValid = 0;
  let selfCount = 0;

  for (const w of r.sth.witnesses) {
    if (w.external) {
      const entry = r.key_directory[w.id];
      if (entry) {
        const ok = hybridVerify(
          message,
          { alg: w.alg, key_id: w.id, ml_dsa: w.ml_dsa, ed25519: w.ed25519 },
          entry,
        ).ok;
        if (ok) externalValid++;
      }
    } else {
      selfCount++;
    }
  }

  // Honesty rule: a self-signature is never independent. The witnesses domain
  // only "passes" when enough EXTERNAL witnesses verify — and in this build
  // there are none, so it is reported as absent, never as a pass.
  const required = Math.max(threshold, 1);
  const selfNote =
    selfCount > 0 ? ` (${selfCount} self-signature${selfCount === 1 ? "" : "s"}, not counted)` : "";
  if (externalValid >= required) {
    return { status: "pass", detail: `${externalValid} independent${selfNote}` };
  }
  return { status: "absent", detail: `${externalValid} independent${selfNote}` };
}
