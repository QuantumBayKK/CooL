/**
 * The live evidence pipeline — one AI change, end to end, in the browser.
 *
 * This is the architecture's vertical slice made executable. Each stage below
 * maps to a layer of the deployed system, and each one declares whether it is
 * REAL (the actual production algorithm, running here) or SIMULATED (a stand-in
 * for something that needs a server, a queue, or a third-party API).
 *
 * That distinction is not decoration. The whole product claim is "you don't have
 * to trust us", so the demo must never quietly present a re-enactment as proof.
 * Everything cryptographic — canonicalization, hashing, hybrid signing, the
 * RFC 6962 log, and verification — is REAL and runs on the visitor's machine.
 * Transport and outbound connectors are SIMULATED and say so.
 */
import { Cool, generateKeypair, verifyReceipt } from "@/lib/cool";
import { canonicalCbor } from "@/lib/cool/canonical";
import { toHex } from "@/lib/cool/codec";
import { coreOf } from "@/lib/cool/record";
import { fromBase64Field } from "@/lib/cool/codec";
import type { Receipt, Verdict } from "@/lib/cool/types";

/** Where a stage's work actually happens in a real deployment. */
export type StageLayer =
  | "capture"
  | "ingest"
  | "evidence"
  | "log"
  | "governance"
  | "verify";

/** Whether a stage runs the production algorithm or stands in for it. */
export type Fidelity = "real" | "simulated";

export interface StageSpec {
  readonly id: string;
  readonly layer: StageLayer;
  readonly fidelity: Fidelity;
  /** Short label — the noun the stage produces. */
  readonly title: string;
  /** What the production system does here. */
  readonly detail: string;
  /** The component that owns this in the deployed architecture. */
  readonly component: string;
}

/**
 * The pipeline, in execution order. Titles are deliberately verbs-of-record:
 * an investor skimming this list should be able to narrate the product.
 */
export const STAGES: readonly StageSpec[] = [
  {
    id: "capture",
    layer: "capture",
    fidelity: "simulated",
    title: "Capture the change",
    detail:
      "The SDK hook fires the moment the prompt changes. Async, buffered, fail-open — it never adds latency and never breaks inference.",
    component: "cool-sdk · CI/CD · gateway hook",
  },
  {
    id: "ingest",
    layer: "ingest",
    fidelity: "simulated",
    title: "Queue it out-of-band",
    detail:
      "The event lands on a durable queue inside the customer's own network. Nothing sits in the critical path of the model call.",
    component: "Rust ingest → Redpanda / NATS",
  },
  {
    id: "canonical",
    layer: "evidence",
    fidelity: "real",
    title: "Canonicalise to fixed bytes",
    detail:
      "The record is encoded as deterministic CBOR (RFC 8949 CDE), so the same logical change always produces the exact same bytes on every machine.",
    component: "Evidence engine (Rust in prod)",
  },
  {
    id: "hash",
    layer: "evidence",
    fidelity: "real",
    title: "Commit with a hash",
    detail:
      "SHA-256 over those bytes becomes the binding hash — a fingerprint of the whole change. Alter one character anywhere and it no longer matches.",
    component: "Evidence engine",
  },
  {
    id: "sign",
    layer: "evidence",
    fidelity: "real",
    title: "Seal it — post-quantum",
    detail:
      "Signed twice over: ML-DSA-65 (FIPS 204, quantum-resistant) and Ed25519 (classical). Both must verify, so the seal holds for the ten-year retention horizon.",
    component: "Hybrid signer · HSM / TEE-held keys",
  },
  {
    id: "log",
    layer: "log",
    fidelity: "real",
    title: "Append to the log",
    detail:
      "The commitment is appended to a tamper-evident Merkle log (RFC 6962 — the mechanism behind Certificate Transparency) and a Signed Tree Head is issued.",
    component: "Transparency log · Trillian / Rekor",
  },
  {
    id: "govern",
    layer: "governance",
    fidelity: "simulated",
    title: "Do the paperwork",
    detail:
      "Policy decides what this change needs, then the workflow writes the change doc, records the approval, files the compliance entry and notifies security.",
    component: "OPA policy · Temporal · Jira / Slack",
  },
  {
    id: "verify",
    layer: "verify",
    fidelity: "real",
    title: "Prove it, without us",
    detail:
      "The receipt is checked offline against the keys it carries. Anyone — an auditor, a regulator, a customer — can run this exact check without asking CooL for anything.",
    component: "cool-verifier (offline)",
  },
] as const;

/** What each connector "wrote" — the manual work that just did not happen. */
export interface GovernanceAction {
  readonly system: string;
  readonly action: string;
  /** Minutes a human would have spent doing this by hand. */
  readonly manualMinutes: number;
}

/**
 * The paperwork one prompt change drags behind it, and what each piece costs
 * by hand. Numbers are the founders' estimate of a single change's tail, not a
 * measured benchmark — the UI labels them as an estimate.
 */
export const GOVERNANCE_ACTIONS: readonly GovernanceAction[] = [
  { system: "Confluence", action: "Change document written and versioned", manualMinutes: 25 },
  { system: "Jira", action: "Change ticket opened, linked to the evidence", manualMinutes: 10 },
  { system: "ServiceNow", action: "Governance register updated", manualMinutes: 20 },
  { system: "Slack", action: "Security and compliance owners notified", manualMinutes: 5 },
  { system: "Audit vault", action: "Tamper-proof evidence filed for retention", manualMinutes: 30 },
] as const;

/** Total human minutes the automated path removes for one change. */
export const MANUAL_MINUTES_PER_CHANGE = GOVERNANCE_ACTIONS.reduce(
  (sum, a) => sum + a.manualMinutes,
  0,
);

/** Live artifacts produced as the pipeline runs, rendered beside the stages. */
export interface PipelineArtifacts {
  /** The prompt diff that triggered everything. */
  changedFrom?: string;
  changedTo?: string;
  /** Deterministic CBOR encoding of the record core. */
  cborBytes?: Uint8Array;
  cborPreview?: string;
  /** The binding commitment. */
  bindingHash?: string;
  /** Signature sizes, so the hybrid scheme is visible rather than asserted. */
  mlDsaBytes?: number;
  ed25519Bytes?: number;
  keyId?: string;
  /** Transparency-log position. */
  leafIndex?: number;
  treeSize?: number;
  rootHash?: string;
  auditPathLength?: number;
  /** Governance connectors that fired. */
  governance?: readonly GovernanceAction[];
  /** The finished, self-contained receipt. */
  receipt?: Receipt;
  /** The offline verdict. */
  verdict?: Verdict;
  /** Wall-clock milliseconds of real cryptographic work (excludes UI dwell). */
  cryptoMs?: number;
}

export type StageStatus = "idle" | "running" | "done" | "failed";

export interface StageState {
  readonly spec: StageSpec;
  status: StageStatus;
  /** Real work time for this stage, in milliseconds. */
  ms?: number;
  /** One-line result shown under the stage once it completes. */
  result?: string;
}

/** A scenario the visitor can run. */
export interface Scenario {
  readonly id: string;
  readonly label: string;
  readonly model: string;
  readonly workflow: string;
  readonly from: string;
  readonly to: string;
  readonly params: Record<string, unknown>;
  /** The policy verdict this change triggers. */
  readonly policy: string;
}

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "credit",
    label: "Loan decisioning",
    model: "acme/credit-scorer@2026.07.1",
    workflow: "retail-lending / adverse-action",
    from: "Score this applicant and return approve or decline.",
    to: "Score this applicant and return approve or decline, with the top three contributing factors.",
    params: { temperature: 0, max_tokens: 512, seed: 7 },
    policy: "Touches a regulated credit decision → security sign-off required",
  },
  {
    id: "claims",
    label: "Health claims triage",
    model: "acme/claims-triage@2026.07.0",
    workflow: "health-claims / prior-auth",
    from: "Summarise the claim and flag anything unusual.",
    to: "Summarise the claim, flag anything unusual, and cite the policy clause behind each flag.",
    params: { temperature: 0.2, max_tokens: 800 },
    policy: "Workflow handles PHI → privacy review + retention tag required",
  },
  {
    id: "agent",
    label: "Autonomous support agent",
    model: "acme/support-agent@2026.07.4",
    workflow: "support / tier-1-autonomy",
    from: "Resolve the ticket. Escalate if you are unsure.",
    to: "Resolve the ticket. You may issue refunds up to ₹5,000 without escalation.",
    params: { temperature: 0.4, tools: ["refund", "lookup"] },
    policy: "Expands agent authority → dual approval required",
  },
] as const;

/** Pause without blocking the compositor. */
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Format a byte count as a short human string. */
export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

/** First `n` bytes of a buffer as spaced hex, for the CBOR preview. */
function hexPreview(bytes: Uint8Array, n = 48): string {
  const head = toHex(bytes.subarray(0, n));
  const pairs = head.match(/.{2}/g) ?? [];
  return pairs.join(" ") + (bytes.length > n ? " …" : "");
}

export interface RunHandlers {
  /** Called whenever a stage changes state, with the full ordered list. */
  onStages: (stages: StageState[]) => void;
  /** Called whenever new artifacts are available. */
  onArtifacts: (artifacts: PipelineArtifacts) => void;
}

/**
 * Run the whole pipeline for one scenario.
 *
 * Deliberately paced: each stage holds for a beat so a viewer can follow what
 * is happening. `ms` values reported per stage are the REAL compute time, not
 * the dwell — so the "how long did the cryptography actually take" number stays
 * honest even though the animation is slower than the machine.
 */
export async function runPipeline(
  scenario: Scenario,
  handlers: RunHandlers,
  dwellMs = 340,
): Promise<{ receipt: Receipt; verdict: Verdict }> {
  const stages: StageState[] = STAGES.map((spec) => ({ spec, status: "idle" }));
  const artifacts: PipelineArtifacts = {
    changedFrom: scenario.from,
    changedTo: scenario.to,
  };

  const pushStages = () => handlers.onStages(stages.map((s) => ({ ...s })));
  const pushArtifacts = () => handlers.onArtifacts({ ...artifacts });

  pushStages();
  pushArtifacts();

  const begin = (i: number) => {
    stages[i]!.status = "running";
    pushStages();
  };
  const finish = (i: number, ms: number, result: string) => {
    stages[i]!.status = "done";
    stages[i]!.ms = ms;
    stages[i]!.result = result;
    pushStages();
  };

  let cryptoMs = 0;

  // ---- 0 · capture -------------------------------------------------------
  begin(0);
  await wait(dwellMs);
  finish(0, 0, "prompt diff captured out-of-band · 0 ms added to inference");

  // ---- 1 · ingest --------------------------------------------------------
  begin(1);
  await wait(dwellMs * 0.7);
  finish(1, 0, "queued in-VPC · prompt text never leaves the customer boundary");

  // Build the signing key and client once the "transport" beat has played.
  const signing = generateKeypair("acme-evidence-key-01");
  const client = new Cool({
    signing,
    log: "memory",
    logId: "acme-prod",
    provider: "customer-vpc",
    backend: ({ prompt }) => ({
      // The demo commits to the change itself; there is no model call to make.
      output: `change accepted: ${prompt.length} chars`,
    }),
  });

  // ---- 2 · canonicalise --------------------------------------------------
  begin(2);
  let t0 = performance.now();
  const { receipt } = await client.complete({
    model: scenario.model,
    prompt: scenario.to,
    params: { ...scenario.params, workflow: scenario.workflow },
  });
  const mintMs = performance.now() - t0;
  cryptoMs += mintMs;

  const core = coreOf(receipt.record);
  const cbor = canonicalCbor(core);
  artifacts.cborBytes = cbor;
  artifacts.cborPreview = hexPreview(cbor);
  pushArtifacts();
  await wait(dwellMs);
  finish(2, 0, `${cbor.length} bytes of deterministic CBOR · same on every machine`);

  // ---- 3 · hash ----------------------------------------------------------
  begin(3);
  artifacts.bindingHash = receipt.binding_hash;
  pushArtifacts();
  await wait(dwellMs * 0.8);
  finish(3, 0, "SHA-256 binding commitment over the canonical bytes");

  // ---- 4 · sign ----------------------------------------------------------
  begin(4);
  artifacts.mlDsaBytes = fromBase64Field(receipt.record.signature.ml_dsa).length;
  artifacts.ed25519Bytes = fromBase64Field(receipt.record.signature.ed25519).length;
  artifacts.keyId = receipt.record.signature.key_id;
  pushArtifacts();
  await wait(dwellMs);
  finish(
    4,
    Math.round(mintMs),
    `ML-DSA-65 (${artifacts.mlDsaBytes} B) + Ed25519 (${artifacts.ed25519Bytes} B) · both required`,
  );

  // ---- 5 · transparency log ---------------------------------------------
  begin(5);
  artifacts.leafIndex = receipt.inclusion?.leaf_index;
  artifacts.treeSize = receipt.inclusion?.tree_size;
  artifacts.rootHash = receipt.sth?.root_hash;
  artifacts.auditPathLength = receipt.inclusion?.audit_path.length;
  pushArtifacts();
  await wait(dwellMs);
  finish(
    5,
    0,
    `leaf ${receipt.inclusion?.leaf_index} of tree(${receipt.inclusion?.tree_size}) · signed tree head issued`,
  );

  // ---- 6 · governance ----------------------------------------------------
  begin(6);
  const fired: GovernanceAction[] = [];
  for (const action of GOVERNANCE_ACTIONS) {
    fired.push(action);
    artifacts.governance = [...fired];
    pushArtifacts();
    await wait(150);
  }
  finish(
    6,
    0,
    `${GOVERNANCE_ACTIONS.length} systems updated · ${MANUAL_MINUTES_PER_CHANGE} min of manual work skipped`,
  );

  artifacts.receipt = receipt;
  pushArtifacts();

  // ---- 7 · offline verification -----------------------------------------
  begin(7);
  t0 = performance.now();
  const verdict = await verifyReceipt(receipt);
  const verifyMs = performance.now() - t0;
  cryptoMs += verifyMs;

  artifacts.verdict = verdict;
  artifacts.cryptoMs = Math.round(cryptoMs);
  pushArtifacts();
  await wait(dwellMs);
  finish(
    7,
    Math.round(verifyMs),
    verdict.ok
      ? "every cryptographic domain checks out, offline"
      : "verification failed — see the domains below",
  );

  return { receipt, verdict };
}

/** The ways a visitor can attack a sealed receipt. */
export type TamperKind = "output" | "model" | "signature" | "root";

export interface TamperOption {
  readonly kind: TamperKind;
  readonly label: string;
  readonly description: string;
}

export const TAMPER_OPTIONS: readonly TamperOption[] = [
  {
    kind: "output",
    label: "Rewrite the result",
    description: "Change what the model is recorded as having produced.",
  },
  {
    kind: "model",
    label: "Swap the model version",
    description: "Claim a different, approved model served the request.",
  },
  {
    kind: "signature",
    label: "Forge the signature",
    description: "Alter the post-quantum seal to match a doctored record.",
  },
  {
    kind: "root",
    label: "Rewrite log history",
    description: "Edit the transparency log's root to hide the entry.",
  },
] as const;

/**
 * Produce a doctored copy of a receipt. Returns the mutated receipt and a
 * human description of exactly which field was touched, so the failing domain
 * can be traced back to the edit.
 */
export function tamperWith(
  receipt: Receipt,
  kind: TamperKind,
): { receipt: Receipt; field: string } {
  // Deep clone through JSON — receipts are plain JSON by construction.
  const copy = JSON.parse(JSON.stringify(receipt)) as Receipt;
  const flipLastHex = (s: string) => s.slice(0, -1) + (s.endsWith("a") ? "b" : "a");
  const mut = copy as unknown as {
    record: {
      response: { output_hash: string };
      model: { version: string };
      signature: { ml_dsa: string };
    };
    sth: { root_hash: string } | null;
  };

  switch (kind) {
    case "output":
      mut.record.response.output_hash = flipLastHex(mut.record.response.output_hash);
      return { receipt: copy, field: "record.response.output_hash" };
    case "model":
      mut.record.model.version = "2026.01.0-approved";
      return { receipt: copy, field: "record.model.version" };
    case "signature": {
      const sig = mut.record.signature.ml_dsa;
      // Flip a character inside the base64 payload, past the "base64:" prefix.
      const at = 12;
      const ch = sig[at] === "A" ? "B" : "A";
      mut.record.signature.ml_dsa = sig.slice(0, at) + ch + sig.slice(at + 1);
      return { receipt: copy, field: "record.signature.ml_dsa" };
    }
    case "root":
      if (mut.sth) {
        mut.sth.root_hash = flipLastHex(mut.sth.root_hash);
        return { receipt: copy, field: "sth.root_hash" };
      }
      return { receipt: copy, field: "sth (absent)" };
  }
}
