/**
 * The demo estate: a mid-size enterprise's AI surface, one quarter in.
 *
 * HONESTY NOTE — this data is synthetic and the dashboard says so on screen.
 * What is NOT synthetic is everything computed from it: the risk model, the
 * rankings, the aggregates, the compliance mapping and the resolutions are the
 * real algorithms operating on this input. Swap in a tenant's live change feed
 * and the same code produces their numbers.
 *
 * Generation is seeded and the clock is a fixed constant, so the server and the
 * browser render byte-identical output. Nothing here calls `Math.random()` or
 * reads the wall clock — a dashboard that reshuffles on hydration would be both
 * a React error and a bad demo.
 */
import { assessRisk, type RiskAssessment, type RiskFeatures } from "./risk";

/** Fixed "now" for the demo estate. Keeps SSR and client hydration in step. */
export const ESTATE_NOW = new Date("2026-07-31T09:15:00.000Z");

/** mulberry32 — small, fast, deterministic. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ChangeKind = "prompt" | "model" | "params" | "tools" | "policy";
export type Environment = "production" | "staging";
export type EvidenceState = "sealed" | "sealing" | "unattested";
export type ApprovalState = "approved" | "pending" | "not-required" | "overdue";

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  /** 0…1 — how sensitive the data it touches is. */
  readonly sensitivity: number;
  /** Regulatory regimes that apply. */
  readonly regimes: readonly string[];
  /** Number of downstream workflows depending on it. */
  readonly dependents: number;
  /** Incidents in the last 90 days. */
  readonly incidents90d: number;
}

export const WORKFLOWS: readonly Workflow[] = [
  {
    id: "wf-lending",
    name: "Retail lending · adverse action",
    unit: "Consumer Credit",
    sensitivity: 0.95,
    regimes: ["EU AI Act · high-risk", "DPDP 2025", "RBI"],
    dependents: 7,
    incidents90d: 2,
  },
  {
    id: "wf-claims",
    name: "Health claims · prior authorisation",
    unit: "Insurance",
    sensitivity: 1.0,
    regimes: ["EU AI Act · high-risk", "HIPAA", "DPDP 2025"],
    dependents: 5,
    incidents90d: 1,
  },
  {
    id: "wf-kyc",
    name: "KYC document extraction",
    unit: "Onboarding",
    sensitivity: 0.85,
    regimes: ["DPDP 2025", "AML"],
    dependents: 9,
    incidents90d: 0,
  },
  {
    id: "wf-support",
    name: "Tier-1 support agent",
    unit: "Customer Ops",
    sensitivity: 0.45,
    regimes: ["DPDP 2025"],
    dependents: 4,
    incidents90d: 3,
  },
  {
    id: "wf-marketing",
    name: "Campaign copy generation",
    unit: "Marketing",
    sensitivity: 0.15,
    regimes: [],
    dependents: 2,
    incidents90d: 0,
  },
  {
    id: "wf-fraud",
    name: "Transaction fraud triage",
    unit: "Risk",
    sensitivity: 0.9,
    regimes: ["EU AI Act · high-risk", "DPDP 2025"],
    dependents: 6,
    incidents90d: 1,
  },
  {
    id: "wf-hr",
    name: "CV screening assistant",
    unit: "People",
    sensitivity: 0.8,
    regimes: ["EU AI Act · high-risk", "DPDP 2025"],
    dependents: 1,
    incidents90d: 0,
  },
  {
    id: "wf-devrel",
    name: "Internal code review bot",
    unit: "Engineering",
    sensitivity: 0.3,
    regimes: [],
    dependents: 3,
    incidents90d: 0,
  },
];

const MODELS = [
  { id: "openai/gpt-5.2", provider: "OpenAI" },
  { id: "anthropic/claude-opus-5", provider: "Anthropic" },
  { id: "meta/llama-4-70b", provider: "Self-hosted" },
  { id: "google/gemini-3-pro", provider: "Google" },
  { id: "mistral/large-3", provider: "Mistral" },
  { id: "acme/credit-scorer", provider: "In-house" },
];

const ACTORS = [
  "p.raman",
  "s.iyer",
  "d.kapoor",
  "a.fernandes",
  "m.grover",
  "ci-bot",
  "n.balan",
  "r.subram",
];

const KIND_LABEL: Record<ChangeKind, string> = {
  prompt: "Prompt edited",
  model: "Model swapped",
  params: "Parameters changed",
  tools: "Tool access changed",
  policy: "Policy updated",
};

export interface AIChange {
  readonly id: string;
  readonly at: Date;
  readonly actor: string;
  readonly workflow: Workflow;
  readonly modelId: string;
  readonly provider: string;
  readonly kind: ChangeKind;
  readonly kindLabel: string;
  readonly summary: string;
  readonly env: Environment;
  readonly evidence: EvidenceState;
  readonly approval: ApprovalState;
  /** Short binding-hash stand-in for the feed; the real one lives on the receipt. */
  readonly digest: string;
  readonly features: RiskFeatures;
  readonly risk: RiskAssessment;
}

const SUMMARIES: Record<ChangeKind, string[]> = {
  prompt: [
    "Added the top-three contributing factors to the decision output",
    "Tightened refusal wording for out-of-policy requests",
    "Rewrote the system preamble to cut hallucinated citations",
    "Added an explicit instruction to cite the governing clause",
    "Shortened context window guidance to reduce token spend",
  ],
  model: [
    "Promoted the next model revision to serve production traffic",
    "Rolled back to the previous revision after latency regression",
    "Switched provider for cost parity at equal eval score",
  ],
  params: [
    "Dropped temperature to 0 for determinism",
    "Raised max tokens to fit longer case files",
    "Pinned the sampling seed for reproducibility",
  ],
  tools: [
    "Granted the agent refund authority up to ₹5,000",
    "Removed direct database write access",
    "Added a read-only policy lookup tool",
  ],
  policy: [
    "Required security sign-off for any PII-touching change",
    "Extended evidence retention to seven years",
    "Added dual approval for authority expansions",
  ],
};

function pick<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)]!;
}

/** Build the feature vector for a change from its own facts. */
function featuresFor(
  r: () => number,
  workflow: Workflow,
  kind: ChangeKind,
  approval: ApprovalState,
  evidence: EvidenceState,
  env: Environment,
): RiskFeatures {
  const envScale = env === "production" ? 1 : 0.45;
  return {
    dataSensitivity: workflow.sensitivity * envScale,
    blastRadius: Math.min(1, workflow.dependents / 9),
    authorityDelta: kind === "tools" ? 0.75 + r() * 0.25 : kind === "policy" ? 0.3 : 0.05,
    modelSwap: kind === "model" ? 0.85 + r() * 0.15 : 0.02,
    approvalGap:
      approval === "overdue" ? 1 : approval === "pending" ? 0.65 : 0,
    evalCoverageDrop: r() < 0.25 ? 0.4 + r() * 0.5 : r() * 0.15,
    incidentHistory: Math.min(1, workflow.incidents90d / 3),
    provenanceGap: evidence === "unattested" ? 0.8 : evidence === "sealing" ? 0.35 : 0.25,
  };
}

function hexish(r: () => number, n: number): string {
  const chars = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(r() * 16)];
  return s;
}

/**
 * Generate the estate's change feed, newest first.
 * @param count how many changes to synthesise
 * @param seed fixed, so the estate is stable across renders and reloads
 */
export function buildEstate(count = 46, seed = 20260731): AIChange[] {
  const r = rng(seed);
  const out: AIChange[] = [];

  for (let i = 0; i < count; i++) {
    const workflow = pick(r, WORKFLOWS);
    const model = pick(r, MODELS);

    // Prompt edits dominate real estates; model swaps are rarer and riskier.
    const roll = r();
    const kind: ChangeKind =
      roll < 0.52 ? "prompt" : roll < 0.7 ? "params" : roll < 0.84 ? "model" : roll < 0.94 ? "tools" : "policy";

    const env: Environment = r() < 0.72 ? "production" : "staging";

    // Approval need follows sensitivity, so regulated workflows gate more.
    const needsApproval = workflow.sensitivity > 0.6 || kind === "tools" || kind === "model";
    let approval: ApprovalState = "not-required";
    if (needsApproval) {
      const a = r();
      approval = a < 0.66 ? "approved" : a < 0.9 ? "pending" : "overdue";
    }

    const e = r();
    const evidence: EvidenceState = e < 0.88 ? "sealed" : e < 0.95 ? "sealing" : "unattested";

    // Spread changes back over ~21 days, clustered toward recent.
    const daysAgo = Math.pow(r(), 1.7) * 21;
    const at = new Date(ESTATE_NOW.getTime() - daysAgo * 86_400_000);

    const features = featuresFor(r, workflow, kind, approval, evidence, env);

    out.push({
      id: `chg_${hexish(r, 10)}`,
      at,
      actor: pick(r, ACTORS),
      workflow,
      modelId: model.id,
      provider: model.provider,
      kind,
      kindLabel: KIND_LABEL[kind],
      summary: pick(r, SUMMARIES[kind]),
      env,
      evidence,
      approval,
      digest: hexish(r, 12),
      features,
      risk: assessRisk(features),
    });
  }

  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/* ── aggregates the console reads ─────────────────────────────────────── */

export interface EstateSummary {
  readonly total: number;
  readonly last7d: number;
  readonly sealed: number;
  readonly sealedPct: number;
  readonly pendingApprovals: number;
  readonly overdueApprovals: number;
  readonly criticalOrHigh: number;
  readonly unattested: number;
  readonly workflowsGoverned: number;
  readonly providers: number;
  /** Human minutes avoided across the whole feed. */
  readonly minutesSaved: number;
  /** Automatable minutes still sitting in the queue. */
  readonly recoverableMinutes: number;
}

/** Manual minutes one change costs without CooL (see the demo pipeline). */
export const MANUAL_MINUTES_PER_CHANGE = 90;

export function summarise(changes: readonly AIChange[]): EstateSummary {
  const weekAgo = ESTATE_NOW.getTime() - 7 * 86_400_000;
  const sealed = changes.filter((c) => c.evidence === "sealed").length;
  const recoverable = changes
    .filter((c) => c.risk.band === "critical" || c.risk.band === "high")
    .flatMap((c) => c.risk.resolutions)
    .filter((res) => res.automatable)
    .reduce((s, res) => s + res.minutesSaved, 0);

  return {
    total: changes.length,
    last7d: changes.filter((c) => c.at.getTime() >= weekAgo).length,
    sealed,
    sealedPct: changes.length ? Math.round((sealed / changes.length) * 100) : 0,
    pendingApprovals: changes.filter((c) => c.approval === "pending").length,
    overdueApprovals: changes.filter((c) => c.approval === "overdue").length,
    criticalOrHigh: changes.filter(
      (c) => c.risk.band === "critical" || c.risk.band === "high",
    ).length,
    unattested: changes.filter((c) => c.evidence === "unattested").length,
    workflowsGoverned: new Set(changes.map((c) => c.workflow.id)).size,
    providers: new Set(changes.map((c) => c.provider)).size,
    minutesSaved: changes.length * MANUAL_MINUTES_PER_CHANGE,
    recoverableMinutes: recoverable,
  };
}

/** Change volume per day, oldest → newest, for the activity sparkline. */
export function dailyVolume(changes: readonly AIChange[], days = 21): number[] {
  const buckets = new Array(days).fill(0) as number[];
  for (const c of changes) {
    const ago = Math.floor((ESTATE_NOW.getTime() - c.at.getTime()) / 86_400_000);
    if (ago >= 0 && ago < days) buckets[days - 1 - ago]! += 1;
  }
  return buckets;
}

/** Per-regime compliance posture, derived from the changes in scope. */
export interface RegimePosture {
  readonly regime: string;
  readonly inScope: number;
  readonly evidenced: number;
  readonly gaps: number;
  readonly pct: number;
  readonly requirement: string;
}

const REGIME_REQUIREMENT: Record<string, string> = {
  "EU AI Act · high-risk":
    "Article 12 — automatic, lifelong event logging for traceability and audit.",
  "DPDP 2025":
    "Security logging, multi-year retention and independent audit for significant data fiduciaries.",
  HIPAA: "Auditable access and change records over protected health information.",
  RBI: "Model governance and auditable decisioning for regulated credit.",
  AML: "Traceable identity-verification decisions and retention.",
};

export function compliancePosture(changes: readonly AIChange[]): RegimePosture[] {
  const regimes = new Map<string, { inScope: number; evidenced: number }>();

  for (const c of changes) {
    for (const regime of c.workflow.regimes) {
      const entry = regimes.get(regime) ?? { inScope: 0, evidenced: 0 };
      entry.inScope += 1;
      // Evidenced means sealed AND not waiting on an approval it needs.
      if (c.evidence === "sealed" && c.approval !== "overdue") entry.evidenced += 1;
      regimes.set(regime, entry);
    }
  }

  return [...regimes.entries()]
    .map(([regime, v]) => ({
      regime,
      inScope: v.inScope,
      evidenced: v.evidenced,
      gaps: v.inScope - v.evidenced,
      pct: v.inScope ? Math.round((v.evidenced / v.inScope) * 100) : 100,
      requirement: REGIME_REQUIREMENT[regime] ?? "",
    }))
    .sort((a, b) => b.inScope - a.inScope);
}

/** Relative time, computed against the fixed estate clock (SSR-stable). */
export function ago(date: Date): string {
  const mins = Math.round((ESTATE_NOW.getTime() - date.getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
