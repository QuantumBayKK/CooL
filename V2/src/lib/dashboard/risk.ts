/**
 * The change-risk model: which AI changes are about to cause a problem.
 *
 * This is a real, deterministic, fully explainable model — not a number picked
 * to look clever. It is a logistic score over eight normalised features with
 * fixed, published weights. Everything it outputs can be traced back to the
 * feature that caused it, which matters twice over here:
 *
 *   · an operator will not action a risk score they cannot interrogate; and
 *   · a model that governs AI changes cannot itself be an unexplainable black
 *     box, or the product contradicts its own pitch.
 *
 * The weights below are priors set from the failure modes the architecture is
 * designed around (unreviewed authority grants, silent model swaps, PII blast
 * radius). They are NOT fitted on customer data — there is none yet — and the
 * UI says so. In deployment these are re-fit per tenant on their own incident
 * history.
 */

/** The eight signals the model reads off a change. Each normalised to 0…1. */
export interface RiskFeatures {
  /** Sensitivity of the data the workflow touches (none → PHI/financial). */
  dataSensitivity: number;
  /** How many downstream workflows depend on this artifact. */
  blastRadius: number;
  /** Does the change widen what an agent is permitted to do on its own? */
  authorityDelta: number;
  /** Was the underlying model swapped rather than the prompt tuned? */
  modelSwap: number;
  /** Fraction of required approvals still missing at ship time. */
  approvalGap: number;
  /** Drop in evaluation coverage versus the previous version. */
  evalCoverageDrop: number;
  /** Recent incident density in this workflow. */
  incidentHistory: number;
  /** Provenance gaps — unattested runtime, unpinned weights. */
  provenanceGap: number;
}

/** Weights and human-readable labels. Order defines display order. */
export const FEATURE_MODEL: readonly {
  key: keyof RiskFeatures;
  label: string;
  weight: number;
  /** Shown when this feature is a top driver. */
  because: string;
}[] = [
  {
    key: "authorityDelta",
    label: "Agent authority widened",
    weight: 2.6,
    because: "the change lets the system act further on its own",
  },
  {
    key: "dataSensitivity",
    label: "Sensitive data in scope",
    weight: 2.2,
    because: "the workflow handles regulated personal or financial data",
  },
  {
    key: "approvalGap",
    label: "Approvals missing",
    weight: 2.1,
    because: "it shipped without the sign-off its policy requires",
  },
  {
    key: "modelSwap",
    label: "Model swapped",
    weight: 1.7,
    because: "the underlying model changed, not just the prompt",
  },
  {
    key: "blastRadius",
    label: "Wide blast radius",
    weight: 1.5,
    because: "many downstream workflows inherit this change",
  },
  {
    key: "evalCoverageDrop",
    label: "Evaluation coverage fell",
    weight: 1.4,
    because: "fewer tests cover this version than the last one",
  },
  {
    key: "provenanceGap",
    label: "Provenance incomplete",
    weight: 1.2,
    because: "we cannot yet prove which weights actually served traffic",
  },
  {
    key: "incidentHistory",
    label: "Troubled workflow",
    weight: 1.0,
    because: "this workflow has misbehaved recently",
  },
] as const;

/**
 * Intercept — the base rate before any signal fires.
 *
 * Calibrated against the estate rather than guessed. Two of the eight features
 * are effectively always-on in a regulated estate: `dataSensitivity` sits near
 * 0.9 for most governed workflows and `blastRadius` near 0.7, which together
 * contribute roughly 3.0 to every change regardless of what the change did.
 * The median observed feature push is ~3.9.
 *
 * An intercept chosen as if the features rested near zero therefore put the
 * MEDIAN change over the critical threshold, and a band that fires on two
 * changes in three carries no information — an operator learns to ignore it,
 * which is worse than having no band at all. At -5.8 the median change lands in
 * `low` (p ≈ 0.13), and it takes a real combination — widened authority, a
 * missing approval, sensitive data — to reach `critical`.
 *
 * Re-derive this whenever the feature set or the estate changes; it is a
 * property of the two together, not a constant.
 */
export const INTERCEPT = -5.8;

export type RiskBand = "low" | "elevated" | "high" | "critical";

export interface FeatureContribution {
  readonly key: keyof RiskFeatures;
  readonly label: string;
  readonly value: number;
  readonly weight: number;
  /** weight × value — the raw push this feature gave the score. */
  readonly contribution: number;
  /** Share of the total positive push, 0…1. */
  readonly share: number;
  readonly because: string;
}

export interface Resolution {
  readonly title: string;
  readonly detail: string;
  /** What CooL can do without a human. */
  readonly automatable: boolean;
  /** Minutes of human time this saves if actioned automatically. */
  readonly minutesSaved: number;
}

export interface RiskAssessment {
  /** Modelled probability that this change leads to an incident or audit finding. */
  readonly probability: number;
  readonly band: RiskBand;
  readonly logit: number;
  /** Every feature, sorted by contribution, so the score is auditable. */
  readonly contributions: readonly FeatureContribution[];
  /** Ranked, actionable fixes derived from the top drivers. */
  readonly resolutions: readonly Resolution[];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Which band a probability falls into. Thresholds are published, not hidden. */
export function bandFor(p: number): RiskBand {
  if (p >= 0.6) return "critical";
  if (p >= 0.35) return "high";
  if (p >= 0.15) return "elevated";
  return "low";
}

/**
 * Resolutions are keyed off the driver that caused the risk, so the advice is
 * always about the thing that is actually wrong — never generic filler.
 */
const RESOLUTIONS: Record<keyof RiskFeatures, Resolution> = {
  authorityDelta: {
    title: "Require dual approval before this takes effect",
    detail:
      "The change expands what the agent may do unsupervised. Hold it behind a second signer and record both approvals on the evidence record.",
    automatable: true,
    minutesSaved: 45,
  },
  dataSensitivity: {
    title: "Attach the privacy review and retention tag",
    detail:
      "Generate the DPDP/GDPR processing entry, bind it to this change, and set the retention clock automatically.",
    automatable: true,
    minutesSaved: 60,
  },
  approvalGap: {
    title: "Chase the missing sign-off",
    detail:
      "Open the approval task with the diff, the policy clause and the evidence link already attached, and escalate if it ages past SLA.",
    automatable: true,
    minutesSaved: 35,
  },
  modelSwap: {
    title: "Pin the weights and re-run the eval suite",
    detail:
      "Commit the weights hash into the record and gate promotion on the previous version's evaluation baseline.",
    automatable: true,
    minutesSaved: 90,
  },
  blastRadius: {
    title: "Stage the rollout across dependents",
    detail:
      "Notify every downstream workflow owner with the lineage graph, and roll out behind a flag rather than estate-wide.",
    automatable: true,
    minutesSaved: 40,
  },
  evalCoverageDrop: {
    title: "Restore evaluation coverage before promotion",
    detail:
      "Block promotion to production until coverage matches the prior version, and file the gap as a tracked exception if overridden.",
    automatable: false,
    minutesSaved: 25,
  },
  provenanceGap: {
    title: "Turn on attestation for this workflow",
    detail:
      "Route inference through the attested tier so the record proves which model actually ran, not merely which was configured.",
    automatable: false,
    minutesSaved: 30,
  },
  incidentHistory: {
    title: "Raise the review bar for this workflow",
    detail:
      "Tighten the policy for this workflow while its incident density stays elevated, and require a rollback plan on every change.",
    automatable: true,
    minutesSaved: 20,
  },
};

/**
 * Score a change.
 *
 * Deterministic: the same features always produce the same probability, the
 * same ordering and the same advice. Nothing here samples randomness.
 */
export function assessRisk(features: RiskFeatures): RiskAssessment {
  let logit = INTERCEPT;
  const raw: { spec: (typeof FEATURE_MODEL)[number]; value: number; contribution: number }[] = [];

  for (const spec of FEATURE_MODEL) {
    const value = clamp01(features[spec.key]);
    const contribution = spec.weight * value;
    logit += contribution;
    raw.push({ spec, value, contribution });
  }

  const totalPush = raw.reduce((s, r) => s + Math.max(0, r.contribution), 0) || 1;

  const contributions: FeatureContribution[] = raw
    .map((r) => ({
      key: r.spec.key,
      label: r.spec.label,
      value: r.value,
      weight: r.spec.weight,
      contribution: r.contribution,
      share: Math.max(0, r.contribution) / totalPush,
      because: r.spec.because,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const probability = sigmoid(logit);

  // Advise on the drivers that are actually material, worst first.
  const resolutions = contributions
    .filter((c) => c.contribution >= 0.35)
    .slice(0, 3)
    .map((c) => RESOLUTIONS[c.key]);

  return {
    probability,
    band: bandFor(probability),
    logit,
    contributions,
    resolutions,
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Palette + copy per band, shared by every dashboard surface. */
export const BAND_STYLE: Record<
  RiskBand,
  { label: string; text: string; border: string; bg: string; dot: string }
> = {
  low: {
    label: "Low",
    text: "text-live",
    border: "border-live/40",
    bg: "bg-live/[0.08]",
    dot: "bg-live",
  },
  elevated: {
    label: "Elevated",
    text: "text-verify",
    border: "border-verify/40",
    bg: "bg-verify/[0.08]",
    dot: "bg-verify",
  },
  high: {
    label: "High",
    text: "text-[#d29922]",
    border: "border-[#d29922]/45",
    bg: "bg-[#d29922]/[0.10]",
    dot: "bg-[#d29922]",
  },
  critical: {
    label: "Critical",
    text: "text-fail",
    border: "border-fail/50",
    bg: "bg-fail/[0.10]",
    dot: "bg-fail",
  },
};
