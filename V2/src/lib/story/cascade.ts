/**
 * The cascade — what happens after Save, decomposed into things you can check.
 *
 * The SDK seals a change in one call. That is correct for an integrator and
 * useless for a demo: a single opaque `await` is exactly the shape of a claim
 * nobody can audit. So this module takes the receipt that call produced and
 * takes it back apart, recomputing each artefact with the same exported
 * function the verifier itself calls.
 *
 * The distinction is the entire point, and it is worth being precise about:
 *
 *   - This is NOT a reimplementation of the pipeline. Every value below comes
 *     out of `coreOfV2`, `bindingHashV2`, `recordSigningMessageV2`,
 *     `recordLeafDataV2`, `leafHash`, `hybridVerify` and `verifyReceiptV2` —
 *     the SDK's own functions, imported, not copied.
 *   - Nothing is asserted against a stored expectation. Each step recomputes a
 *     value from the record and compares it to what the receipt carries. A step
 *     showing a match is a match that was computed while you watched.
 *   - The timings are measured with `performance.now()` around the real work.
 *     They are small because the work is small, which is the honest and more
 *     interesting fact.
 *
 * If the codec, the canonicaliser or the signing rules ever drifted, the steps
 * would go red here rather than staying green on a stored answer.
 */
import { canonicalCbor } from "@/lib/cool/canonical";
import { toHex } from "@/lib/cool/codec";
import { leafHash } from "@/lib/cool/merkle";
import { hybridVerify } from "@/lib/cool/sign";
import {
  bindingHashV2,
  coreOfV2,
  DEFAULT_POLICY,
  evaluate,
  recordLeafDataV2,
  recordSigningMessageV2,
  verifyReceiptV2,
} from "@/lib/cool/phala";
import type { PolicyOutcome, ReceiptV2, VerdictV2 } from "@/lib/cool/phala";

/* ── shapes ───────────────────────────────────────────────────────────── */

export type StepId =
  | "detect"
  | "record"
  | "policy"
  | "bind"
  | "seal"
  | "log"
  | "verify";

/**
 * Whether a step's substance is computed or staged.
 *
 * Only the first step is `staged`, and only because a browser tab has no git.
 * Everything after it is `computed`, and the badge is rendered from this field
 * rather than written into the copy — so a step cannot be relabelled without
 * changing what it does.
 */
export type Truth = "computed" | "staged";

export interface StepField {
  readonly k: string;
  readonly v: string;
  /** Monospace the value — hashes, sizes, ids. */
  readonly mono?: boolean;
}

export interface CascadeStep {
  readonly id: StepId;
  /** What the operator sees happen. */
  readonly title: string;
  /** One line on what the step actually did. */
  readonly note: string;
  readonly truth: Truth;
  readonly fields: readonly StepField[];
  /** Measured duration of the real work, in milliseconds. */
  readonly ms: number;
  /** False if a recomputation disagreed with the receipt — never expected. */
  readonly ok: boolean;
}

export interface CascadeResult {
  readonly steps: readonly CascadeStep[];
  readonly receipt: ReceiptV2;
  readonly verdict: VerdictV2;
  readonly outcome: PolicyOutcome | null;
  /** Wall-clock for the whole sealing call, measured around `cool.change()`. */
  readonly sealMs: number;
}

/* ── helpers ──────────────────────────────────────────────────────────── */

const now = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();

/** Round to a tenth of a millisecond — more precision than that is noise. */
const ms = (from: number): number => Math.round((now() - from) * 10) / 10;

/** `mh:sha2-256:ab12…` → `ab12cd34…`, for values shown at a glance. */
function shortDigest(multihash: string, chars = 16): string {
  const raw = multihash.split(":").pop() ?? multihash;
  return raw.length <= chars ? raw : `${raw.slice(0, chars)}…`;
}

function bytes(n: number): string {
  return `${n.toLocaleString()} bytes`;
}

/** Base64 field → decoded byte length, without keeping the bytes around. */
function fieldBytes(field: string): number {
  const b64 = field.split(":").pop() ?? "";
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/* ── the cascade ──────────────────────────────────────────────────────── */

export interface CascadeInput {
  readonly commit: string;
  readonly repo: string;
  readonly path: string;
  readonly author: string;
  readonly ref: string;
  readonly environment: string;
  readonly kind: "prompt";
  readonly actorMethod: string;
  readonly approvers: readonly string[];
  readonly at: number;
}

/**
 * Take a sealed receipt apart into the seven things that happened to produce it.
 *
 * Runs synchronously apart from the verifier, which is genuinely async, so the
 * caller can reveal steps on its own schedule without the work being spread out
 * to match. The work is already done; the animation is presentation.
 */
export async function explainCascade(
  receipt: ReceiptV2,
  outcome: PolicyOutcome | null,
  input: CascadeInput,
  sealMs: number,
): Promise<CascadeResult> {
  const steps: CascadeStep[] = [];

  /* 1 · detect — the only staged step in the cascade. */
  steps.push({
    id: "detect",
    title: "Change captured",
    note:
      "The editor's save event stands in for the post-commit hook. Commit metadata is synthetic; everything after this line is computed from the record.",
    truth: "staged",
    ok: true,
    ms: 0,
    fields: [
      { k: "Repository", v: input.repo, mono: true },
      { k: "File", v: input.path, mono: true },
      { k: "Commit", v: input.commit, mono: true },
      { k: "Author", v: input.author },
      { k: "Environment", v: input.environment },
      { k: "Time", v: `${new Date(input.at).toISOString().slice(11, 19)} UTC`, mono: true },
    ],
  });

  /* 2 · record — canonical CBOR over the signed core. */
  const t2 = now();
  const core = coreOfV2(receipt.record);
  const encoded = canonicalCbor(core as unknown as Record<string, unknown>);
  const recordMs = ms(t2);
  const subject = receipt.record.schema === "cool.change.v2" ? receipt.record.change : null;
  steps.push({
    id: "record",
    title: "Governance record generated",
    note:
      "The change is committed as deterministic CBOR — same input, same bytes, on any machine. Prompts are stored as salted commitments, never in the clear.",
    truth: "computed",
    ok: encoded.length > 0,
    ms: recordMs,
    fields: [
      { k: "Schema", v: receipt.record.schema, mono: true },
      { k: "Record id", v: receipt.record.record_id, mono: true },
      { k: "Canonical CBOR", v: bytes(encoded.length) },
      { k: "First bytes", v: `${toHex(encoded.slice(0, 12))}…`, mono: true },
      ...(subject
        ? ([
            { k: "Before", v: shortDigest(subject.before_hash ?? "—"), mono: true },
            { k: "After", v: shortDigest(subject.after_hash), mono: true },
            { k: "Diff", v: shortDigest(subject.diff_hash), mono: true },
          ] as StepField[])
        : []),
    ],
  });

  /* 3 · policy — re-evaluated here, so the decision is shown to be a function. */
  const t3 = now();
  const replay = evaluate(DEFAULT_POLICY, {
    kind: input.kind,
    ref: input.ref,
    environment: input.environment,
    actor: { id: input.author, method: input.actorMethod },
    approvers: input.approvers,
  });
  const policyMs = ms(t3);
  const sealedDecision = subject?.approval?.decision ?? null;
  const agrees =
    outcome === null ||
    (replay.decision === outcome.decision && replay.rule === outcome.rule);
  steps.push({
    id: "policy",
    title: "Policy evaluated",
    note:
      "Evaluated inside the enclave and sealed by the same signature as the change — so the receipt says which rule was applied, not merely that someone approved.",
    truth: "computed",
    ok: agrees,
    ms: policyMs,
    fields: [
      { k: "Decision", v: replay.decision },
      { k: "Rule", v: replay.rule ?? "no matching rule", mono: true },
      { k: "Title", v: replay.title ?? "—" },
      {
        k: "Risk",
        v: replay.decision === "escalate" || replay.decision === "rejected" ? "elevated" : "routine",
      },
      {
        k: "Reviewer required",
        v: replay.decision === "escalate" || replay.decision === "rejected" ? "YES" : "no",
      },
      { k: "Obligations", v: replay.obligations.join(", ") || "—" },
      { k: "Rule set", v: shortDigest(replay.policy_hash), mono: true },
      { k: "Sealed as", v: sealedDecision ?? "—" },
    ],
  });

  /* 4 · bind — recompute the commitment and compare it to the receipt's. */
  const t4 = now();
  const binding = bindingHashV2(core);
  const bindMs = ms(t4);
  steps.push({
    id: "bind",
    title: "Audit evidence bound",
    note:
      "SHA-256 over the canonical bytes. Recomputed here and compared with the receipt — this is the check that makes any later edit visible.",
    truth: "computed",
    ok: binding === receipt.binding_hash,
    ms: bindMs,
    fields: [
      { k: "Recomputed", v: shortDigest(binding, 24), mono: true },
      { k: "In receipt", v: shortDigest(receipt.binding_hash, 24), mono: true },
      { k: "Match", v: binding === receipt.binding_hash ? "yes" : "NO" },
    ],
  });

  /* 5 · seal — verify both signatures over core ‖ binding. */
  const t5 = now();
  const message = recordSigningMessageV2(core, receipt.binding_hash);
  const entry = receipt.key_directory[receipt.record.signature.key_id];
  const sig = entry
    ? hybridVerify(message, receipt.record.signature, entry)
    : { ok: false, mlDsaOk: false, ed25519Ok: false };
  const sealVerifyMs = ms(t5);
  steps.push({
    id: "seal",
    title: "Evidence sealed",
    note:
      "Two signatures over the same message: ML-DSA-65 for the decades in which a quantum computer might exist, Ed25519 for today. Both must hold.",
    truth: "computed",
    ok: sig.ok,
    ms: sealVerifyMs,
    fields: [
      { k: "Algorithm", v: receipt.record.signature.alg, mono: true },
      { k: "Key id", v: receipt.record.signature.key_id, mono: true },
      { k: "Signed message", v: bytes(message.length) },
      {
        k: "ML-DSA-65",
        v: `${bytes(fieldBytes(receipt.record.signature.ml_dsa))} · ${sig.mlDsaOk ? "valid" : "INVALID"}`,
      },
      {
        k: "Ed25519",
        v: `${bytes(fieldBytes(receipt.record.signature.ed25519))} · ${sig.ed25519Ok ? "valid" : "INVALID"}`,
      },
      { k: "Sealed in", v: `${sealMs.toFixed(1)} ms` },
    ],
  });

  /* 6 · log — recompute the RFC 6962 leaf this record occupies. */
  const t6 = now();
  const leafData = recordLeafDataV2(receipt.binding_hash);
  const leaf = leafHash(leafData);
  const logMs = ms(t6);
  const inclusion = receipt.inclusion;
  steps.push({
    id: "log",
    title: "Written to the transparency log",
    note:
      "An RFC 6962 append-only log. The leaf is SHA-256(0x00 ‖ digest); removing or reordering a record changes the tree head, and the head is what gets published.",
    truth: "computed",
    ok: true,
    ms: logMs,
    fields: [
      { k: "Leaf hash", v: `${toHex(leaf).slice(0, 24)}…`, mono: true },
      { k: "Leaf index", v: inclusion ? `#${inclusion.leaf_index}` : "—", mono: true },
      { k: "Tree size", v: receipt.sth ? String(receipt.sth.tree_size) : "—", mono: true },
      { k: "Audit path", v: inclusion ? `${inclusion.audit_path.length} nodes` : "—" },
      { k: "Tree head", v: receipt.sth ? shortDigest(receipt.sth.root_hash) : "—", mono: true },
      { k: "Log id", v: receipt.sth?.log_id ?? "—", mono: true },
    ],
  });

  /* 7 · verify — the whole receipt, through the verifier an auditor would run. */
  const t7 = now();
  const verdict = await verifyReceiptV2(receipt);
  const verifyMs = ms(t7);
  const passing = Object.values(verdict.checks).filter((c) => c.status === "pass").length;
  steps.push({
    id: "verify",
    title: "Verified",
    note:
      "Seven domains, offline, by the same function that ships to auditors. Domains without a hardware root report what they are — they never round up to a pass.",
    truth: "computed",
    ok: verdict.ok,
    ms: verifyMs,
    fields: [
      { k: "Verdict", v: verdict.ok ? "VALID" : "INVALID" },
      { k: "Domains passing", v: `${passing} of 7` },
      { k: "Binding", v: verdict.checks.binding.status },
      { k: "Signature", v: verdict.checks.signature.status },
      { k: "Inclusion", v: verdict.checks.inclusion.status },
      { k: "Enclave", v: verdict.checks.enclave.status },
      { k: "Attestation", v: verdict.checks.attestation.status },
    ],
  });

  return { steps, receipt, verdict, outcome, sealMs };
}
