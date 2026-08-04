/**
 * The estate the console opens onto.
 *
 * Synthetic, and labelled as such everywhere it is shown — a real one would be a
 * customer's private data, which is the entire premise of the product. What is
 * NOT synthetic is everything computed from it: each seed below is pushed
 * through the real capture queue, sealed by the real evidence engine inside the
 * (simulated) enclave, and verified by the real verifier. The rows in the ledger
 * are receipts, not fixtures.
 *
 * The scenario is a mid-sized bank's AI estate, because that is where the
 * problem bites hardest: four systems, three of them high-risk under the EU AI
 * Act, and a change cadence that no human is going to document by hand.
 */
import type { ChangeKind } from "@/lib/cool/phala";

export const APPROVED_IMAGE = "sha256:9d945ef57b3a1c0e-cool-evidence-plane-2.1.0";
export const ROGUE_IMAGE = "sha256:0b17e4c9aa21f7d3-evidence-engine-patched";

/** A system in the estate — what the changes and inferences hang off. */
export interface EstateSystem {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly riskTier: "high" | "limited" | "minimal";
  readonly regimes: readonly string[];
}

export const SYSTEMS: readonly EstateSystem[] = [
  {
    id: "billing/refund-agent",
    name: "Refund agent",
    owner: "Payments",
    riskTier: "limited",
    regimes: ["DPDP 2025", "PCI DSS 4.0"],
  },
  {
    id: "credit/underwriting",
    name: "Credit underwriting",
    owner: "Risk",
    riskTier: "high",
    regimes: ["EU AI Act Art. 12", "EU AI Act Art. 14", "RBI DLG"],
  },
  {
    id: "kyc/document-review",
    name: "KYC document review",
    owner: "Compliance",
    riskTier: "high",
    regimes: ["EU AI Act Art. 12", "DPDP 2025"],
  },
  {
    id: "support/copilot",
    name: "Support copilot",
    owner: "Customer Ops",
    riskTier: "minimal",
    regimes: ["DPDP 2025"],
  },
];

/** A seeded change — replayed through the SDK on boot. */
export interface SeedChange {
  readonly kind: ChangeKind;
  readonly ref: string;
  readonly system: string;
  readonly environment: string;
  readonly before?: string;
  readonly after: string;
  readonly actor: { id: string; method: string };
  readonly approval?: {
    policy_id: string;
    decision: "auto-approved" | "approved" | "rejected" | "waived";
    approvers: string[];
  };
  /** Minutes before "now" — used only for display ordering. */
  readonly minutesAgo: number;
}

export const SEED_CHANGES: readonly SeedChange[] = [
  {
    kind: "prompt",
    ref: "billing/refund-agent#system",
    system: "billing/refund-agent",
    environment: "prod",
    minutesAgo: 14,
    before:
      "You are a refund assistant for retail banking.\nApprove refunds up to $50 without escalation.\nAlways ask for the transaction reference.",
    after:
      "You are a refund assistant for retail banking.\nApprove refunds up to $500 without escalation.\nAlways ask for the transaction reference.\nEscalate anything flagged as disputed.",
    actor: { id: "ci:github-actions", method: "oidc" },
    approval: {
      policy_id: "POL-014",
      decision: "approved",
      approvers: ["priya@bank.example", "marcus@bank.example"],
    },
  },
  {
    kind: "model",
    ref: "credit/underwriting#scorer",
    system: "credit/underwriting",
    environment: "prod",
    minutesAgo: 47,
    before: "phala/deepseek-v4-flash@2026.05",
    after: "phala/deepseek-v4-pro@2026.07",
    actor: { id: "user:marcus@bank.example", method: "session" },
    approval: {
      policy_id: "POL-002",
      decision: "approved",
      approvers: ["risk-committee@bank.example", "cro@bank.example"],
    },
  },
  {
    kind: "agent-permission",
    ref: "support/copilot#tools",
    system: "support/copilot",
    environment: "prod",
    minutesAgo: 96,
    before: "read:tickets\nread:kb",
    after: "read:tickets\nread:kb\nwrite:tickets\nrefund:initiate",
    actor: { id: "user:dev-oncall@bank.example", method: "session" },
    approval: { policy_id: "POL-031", decision: "rejected", approvers: ["dev-oncall@bank.example"] },
  },
  {
    kind: "params",
    ref: "kyc/document-review#inference",
    system: "kyc/document-review",
    environment: "prod",
    minutesAgo: 180,
    before: '{"temperature":0.0,"top_p":1.0,"max_tokens":1024}',
    after: '{"temperature":0.4,"top_p":0.9,"max_tokens":2048}',
    actor: { id: "ci:github-actions", method: "oidc" },
    approval: { policy_id: "POL-008", decision: "approved", approvers: ["compliance@bank.example"] },
  },
  {
    kind: "policy",
    ref: "credit/underwriting#adverse-action",
    system: "credit/underwriting",
    environment: "prod",
    minutesAgo: 320,
    before: "Explain declines using the top 2 contributing factors.",
    after:
      "Explain declines using the top 4 contributing factors.\nInclude the reference data window.\nNever cite protected attributes.",
    actor: { id: "user:compliance@bank.example", method: "session" },
    approval: {
      policy_id: "POL-002",
      decision: "approved",
      approvers: ["compliance@bank.example", "cro@bank.example"],
    },
  },
  {
    kind: "dataset",
    ref: "kyc/document-review#reference-set",
    system: "kyc/document-review",
    environment: "staging",
    minutesAgo: 470,
    before: "kyc-reference-2026-Q1",
    after: "kyc-reference-2026-Q2",
    actor: { id: "service:data-pipeline", method: "service-account" },
    approval: { policy_id: "POL-008", decision: "auto-approved", approvers: [] },
  },
  {
    kind: "tool",
    ref: "billing/refund-agent#tools",
    system: "billing/refund-agent",
    environment: "staging",
    minutesAgo: 620,
    after: "read:transactions\nread:disputes",
    actor: { id: "ci:github-actions", method: "oidc" },
    approval: { policy_id: "POL-031", decision: "auto-approved", approvers: [] },
  },
  {
    kind: "prompt",
    ref: "credit/underwriting#system",
    system: "credit/underwriting",
    environment: "prod",
    minutesAgo: 900,
    before:
      "Assess creditworthiness from the supplied bureau summary.\nReturn a score from 0-100 and the two largest factors.",
    after:
      "Assess creditworthiness from the supplied bureau summary.\nReturn a score from 0-100 and the four largest factors.\nState the reference window for every factor.",
    actor: { id: "user:priya@bank.example", method: "session" },
    approval: {
      policy_id: "POL-002",
      decision: "approved",
      approvers: ["risk-committee@bank.example", "cro@bank.example"],
    },
  },
];

/** A seeded inference — replayed through the SDK on boot. */
export interface SeedInference {
  readonly system: string;
  readonly model: string;
  readonly prompt: string;
  readonly output: string;
  readonly params: Record<string, unknown>;
  readonly gpu: string | null;
  readonly minutesAgo: number;
}

export const SEED_INFERENCES: readonly SeedInference[] = [
  {
    system: "credit/underwriting",
    model: "phala/deepseek-v4-pro@2026.07",
    prompt: "Assess application A-40182. Bureau summary attached. Requested limit ₹4,00,000.",
    output: "Score 62/100. Decline. Factors: thin file (18 months), 3 recent enquiries, DTI 0.48.",
    params: { temperature: 0.2, top_p: 0.9, seed: 40182 },
    gpu: "H200",
    minutesAgo: 3,
  },
  {
    system: "kyc/document-review",
    model: "phala/qwen3.6-27b@2026.06",
    prompt: "Extract identity fields from the attached passport scan and flag inconsistencies.",
    output: "Fields extracted. Flag: MRZ checksum mismatch on line 2 — route to manual review.",
    params: { temperature: 0.0, top_p: 1 },
    gpu: "H200",
    minutesAgo: 9,
  },
  {
    system: "billing/refund-agent",
    model: "phala/deepseek-v4-flash@2026.07",
    prompt: "Customer requests refund of ₹2,340 for transaction TXN-99821, marked disputed.",
    output: "Disputed transaction — escalating to a human agent per policy. No auto-refund issued.",
    params: { temperature: 0.2, top_p: 0.9 },
    gpu: null,
    minutesAgo: 21,
  },
  {
    system: "support/copilot",
    model: "phala/gemma-4-31b@2026.06",
    prompt: "Draft a reply explaining why a card was blocked after three failed 3DS attempts.",
    output: "Drafted. Tone: reassuring. Includes unblock steps and the fraud-team contact window.",
    params: { temperature: 0.6, top_p: 0.95 },
    gpu: null,
    minutesAgo: 34,
  },
  {
    system: "credit/underwriting",
    model: "phala/deepseek-v4-pro@2026.07",
    prompt: "Assess application A-40191. Bureau summary attached. Requested limit ₹1,20,000.",
    output: "Score 81/100. Approve at ₹1,20,000. Factors: 6-year file, zero delinquencies, DTI 0.21.",
    params: { temperature: 0.2, top_p: 0.9, seed: 40191 },
    gpu: "H200",
    minutesAgo: 52,
  },
  {
    system: "kyc/document-review",
    model: "phala/qwen3.6-27b@2026.06",
    prompt: "Compare the address on the utility bill against the CRM record for customer C-8871.",
    output: "Match with formatting variance (flat number). Confidence 0.94. No action required.",
    params: { temperature: 0.0, top_p: 1 },
    gpu: "H200",
    minutesAgo: 71,
  },
];

/** Compliance obligations the export maps evidence onto. */
export interface Obligation {
  readonly id: string;
  readonly regime: string;
  readonly clause: string;
  readonly requirement: string;
  /** Which receipt field satisfies it — the mapping the audit export prints. */
  readonly satisfiedBy: string;
}

export const OBLIGATIONS: readonly Obligation[] = [
  {
    id: "eu-ai-act-12",
    regime: "EU AI Act",
    clause: "Article 12 — record-keeping",
    requirement: "High-risk systems keep automatic logs of their operation over their lifetime.",
    satisfiedBy: "every inference record, sealed at the time of the call",
  },
  {
    id: "eu-ai-act-14",
    regime: "EU AI Act",
    clause: "Article 14 — human oversight",
    requirement: "Oversight measures are documented and traceable to a named person.",
    satisfiedBy: "change.approval.approvers, inside the signature",
  },
  {
    id: "eu-ai-act-15",
    regime: "EU AI Act",
    clause: "Article 15 — accuracy & robustness",
    requirement: "Changes affecting accuracy are recorded with their provenance.",
    satisfiedBy: "change records for model, params and dataset kinds",
  },
  {
    id: "dpdp-8",
    regime: "DPDP Rules 2025",
    clause: "Section 8 — reasonable security safeguards",
    requirement: "Personal data is protected in processing, with retained evidence of controls.",
    satisfiedBy: "TEE measurement in the signed core; no plaintext in any record",
  },
  {
    id: "iso-42001-9",
    regime: "ISO/IEC 42001",
    clause: "Clause 9 — performance evaluation",
    requirement: "The AI management system is monitored with retained records.",
    satisfiedBy: "transparency-log inclusion proofs over the whole estate",
  },
  {
    id: "rbi-dlg",
    regime: "RBI Digital Lending",
    clause: "Model governance",
    requirement: "Model versions in credit decisions are auditable after the fact.",
    satisfiedBy: "model id, version and weights hash committed per record",
  },
];
