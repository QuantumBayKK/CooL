/**
 * Connectors and the indexed history they feed.
 *
 * Two things live here because they are the same story told at two scales:
 * the connectors are how CooL reaches into the systems a company already runs,
 * and the history index is what those connectors accumulate into — a searchable
 * record of every AI change, error and audit, which is the thing that turns a
 * four-hour incident investigation into one query.
 *
 * Everything is static and deterministic. Counts and timings are illustrative
 * of a mid-size estate; the UI labels them as demo figures.
 */

export type ConnectorStatus = "connected" | "available" | "planned";
export type Direction = "read" | "write" | "both";

export interface Connector {
  readonly id: string;
  readonly name: string;
  readonly vendor: string;
  readonly category:
    | "Source control"
    | "Atlassian"
    | "Messaging"
    | "ITSM & GRC"
    | "AI gateway"
    | "Telemetry"
    | "Identity";
  readonly status: ConnectorStatus;
  readonly direction: Direction;
  readonly auth: string;
  /** What CooL takes from it. */
  readonly reads: readonly string[];
  /** What CooL puts back into it — where the manual work disappears. */
  readonly writes: readonly string[];
  /** Events exchanged in the demo estate over 7 days. */
  readonly events7d: number;
  readonly lastSync: string;
}

export const CONNECTORS: readonly Connector[] = [
  {
    id: "github",
    name: "GitHub",
    vendor: "GitHub",
    category: "Source control",
    status: "connected",
    direction: "both",
    auth: "GitHub App · fine-grained repo permissions",
    reads: ["Commits and diffs", "Pull requests", "Actions workflow runs", "Release tags"],
    writes: ["PR annotations with the AI-change summary", "Check runs gating on policy", "Status of evidence sealing"],
    events7d: 412,
    lastSync: "40s ago",
  },
  {
    id: "jira",
    name: "Jira Cloud",
    vendor: "Atlassian",
    category: "Atlassian",
    status: "connected",
    direction: "both",
    auth: "Atlassian OAuth 2.0 (3LO) · scoped to project",
    reads: ["Issue state and transitions", "Approver assignments", "Existing change tickets"],
    writes: [
      "AI Change issues, fully populated",
      "Remote links to commit, PR and evidence",
      "Approval sub-tasks with context attached",
      "Workflow transitions on policy decisions",
    ],
    events7d: 168,
    lastSync: "2m ago",
  },
  {
    id: "confluence",
    name: "Confluence Cloud",
    vendor: "Atlassian",
    category: "Atlassian",
    status: "connected",
    direction: "write",
    auth: "Atlassian OAuth 2.0 (3LO) · scoped to space",
    reads: [],
    writes: [
      "Change documents, generated from the captured change",
      "Compliance labels (EU AI Act, DPDP)",
      "Version history linked to the evidence record",
    ],
    events7d: 143,
    lastSync: "2m ago",
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    vendor: "Atlassian",
    category: "Atlassian",
    status: "available",
    direction: "both",
    auth: "Atlassian OAuth 2.0 (3LO)",
    reads: ["Commits", "Pull requests", "Pipelines"],
    writes: ["PR comments with change summary", "Build status on policy gates"],
    events7d: 0,
    lastSync: "not connected",
  },
  {
    id: "slack",
    name: "Slack",
    vendor: "Slack",
    category: "Messaging",
    status: "connected",
    direction: "write",
    auth: "Slack app · bot token, channel-scoped",
    reads: [],
    writes: [
      "Change notifications with the verify link",
      "Approval nudges and SLA escalations",
      "Incident threads linked to the causing change",
    ],
    events7d: 291,
    lastSync: "1m ago",
  },
  {
    id: "servicenow",
    name: "ServiceNow GRC",
    vendor: "ServiceNow",
    category: "ITSM & GRC",
    status: "connected",
    direction: "both",
    auth: "OAuth 2.0 · integration user, least privilege",
    reads: ["Control definitions", "Existing risk register entries"],
    writes: [
      "AI Change Register entries",
      "Retention clocks per regime",
      "Evidence references for audit export",
    ],
    events7d: 96,
    lastSync: "5m ago",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    vendor: "PagerDuty",
    category: "ITSM & GRC",
    status: "connected",
    direction: "both",
    auth: "Events API v2 · routing key",
    reads: ["Incident lifecycle", "On-call assignment"],
    writes: ["Incidents raised from anomaly detection", "The change lineage that caused them"],
    events7d: 11,
    lastSync: "18m ago",
  },
  {
    id: "litellm",
    name: "LiteLLM / Portkey",
    vendor: "AI gateway",
    category: "AI gateway",
    status: "connected",
    direction: "read",
    auth: "Gateway hook · in-VPC",
    reads: [
      "Which model served which request",
      "Prompt and config version in play",
      "Token and cost per call",
    ],
    writes: [],
    events7d: 1_240_000,
    lastSync: "live",
  },
  {
    id: "otel",
    name: "OpenTelemetry",
    vendor: "CNCF",
    category: "Telemetry",
    status: "connected",
    direction: "read",
    auth: "OTLP collector · in-VPC",
    reads: ["Spans covering inference calls", "Latency and error rates", "Deployment markers"],
    writes: [],
    events7d: 4_180_000,
    lastSync: "live",
  },
  {
    id: "okta",
    name: "Okta / Entra ID",
    vendor: "Identity",
    category: "Identity",
    status: "connected",
    direction: "read",
    auth: "OIDC / SAML SSO + SCIM provisioning",
    reads: ["User and group membership", "Approver eligibility", "Deprovisioning events"],
    writes: [],
    events7d: 58,
    lastSync: "12m ago",
  },
  {
    id: "gitlab",
    name: "GitLab",
    vendor: "GitLab",
    category: "Source control",
    status: "available",
    direction: "both",
    auth: "CI component + project access token",
    reads: ["Commits", "Merge requests", "Pipelines"],
    writes: ["MR notes", "Pipeline gates on policy"],
    events7d: 0,
    lastSync: "not connected",
  },
  {
    id: "splunk",
    name: "Splunk / Elastic",
    vendor: "SIEM",
    category: "Telemetry",
    status: "planned",
    direction: "write",
    auth: "HEC token",
    reads: [],
    writes: ["Evidence events forwarded to the customer's SIEM"],
    events7d: 0,
    lastSync: "planned",
  },
];

/* ── the indexed history ──────────────────────────────────────────────── */

export type HistoryKind = "error" | "audit" | "change" | "incident";

export interface HistoryEntry {
  readonly id: string;
  readonly kind: HistoryKind;
  readonly at: string;
  readonly title: string;
  readonly workflow: string;
  readonly summary: string;
  /** How it ended. */
  readonly outcome: "resolved" | "open" | "accepted" | "passed" | "finding";
  /** Minutes from symptom to root cause, where CooL's index did the work. */
  readonly timeToCauseMinutes?: number;
  /** What it was traced back to. */
  readonly rootCause?: string;
  readonly regimes?: readonly string[];
  readonly tags: readonly string[];
}

/**
 * A year of indexed history. The point of this list is not its length — it is
 * that every entry carries the change it traces back to, which is what makes
 * "why did this break" a lookup rather than an investigation.
 */
export const HISTORY: readonly HistoryEntry[] = [
  {
    id: "INC-4471",
    kind: "incident",
    at: "2026-07-30",
    title: "Refund volume anomaly after authority expansion",
    workflow: "support / tier-1-autonomy",
    summary:
      "Refunds without escalation rose 6× within four hours of an agent authority change taking effect.",
    outcome: "resolved",
    timeToCauseMinutes: 1,
    rootCause: "SUP-1177 — authority expanded with no per-transaction ceiling",
    tags: ["authority", "agent", "rollback"],
  },
  {
    id: "ERR-3390",
    kind: "error",
    at: "2026-07-22",
    title: "Adverse-action reasons missing from 4% of decisions",
    workflow: "retail-lending / adverse-action",
    summary:
      "A prompt edit shortened the output schema, dropping the reason codes a regulator requires.",
    outcome: "resolved",
    timeToCauseMinutes: 3,
    rootCause: "LEND-2795 — prompt truncation to reduce token spend",
    regimes: ["EU AI Act · Article 12"],
    tags: ["schema", "regulatory", "prompt"],
  },
  {
    id: "AUD-2026-Q2",
    kind: "audit",
    at: "2026-07-04",
    title: "Q2 internal audit — AI change controls",
    workflow: "estate-wide",
    summary:
      "Auditor sampled 40 changes. Every sampled record verified offline against its own evidence.",
    outcome: "passed",
    regimes: ["EU AI Act · Article 12", "DPDP Rules 2025"],
    tags: ["internal", "sampling", "evidence"],
  },
  {
    id: "ERR-3204",
    kind: "error",
    at: "2026-06-18",
    title: "Silent model swap in KYC extraction",
    workflow: "KYC document extraction",
    summary:
      "A provider-side model revision changed extraction behaviour without a corresponding change record.",
    outcome: "resolved",
    timeToCauseMinutes: 6,
    rootCause: "Provider auto-upgrade — now pinned by weights hash",
    tags: ["model-swap", "provider", "pinning"],
  },
  {
    id: "AUD-2026-DPDP",
    kind: "audit",
    at: "2026-05-29",
    title: "DPDP readiness review",
    workflow: "estate-wide",
    summary:
      "Retention clocks and processing records verified across every workflow touching personal data.",
    outcome: "finding",
    regimes: ["DPDP Rules 2025"],
    tags: ["retention", "dpdp", "processing-record"],
  },
  {
    id: "ERR-3011",
    kind: "error",
    at: "2026-05-12",
    title: "Evaluation coverage regression on claims triage",
    workflow: "health-claims / prior-auth",
    summary:
      "A model promotion shipped with 22% fewer evaluation cases than the version it replaced.",
    outcome: "resolved",
    timeToCauseMinutes: 2,
    rootCause: "CLM-0788 — eval suite not updated with the new schema",
    tags: ["eval", "coverage", "promotion"],
  },
  {
    id: "CHG-8842",
    kind: "change",
    at: "2026-04-30",
    title: "Estate-wide policy: dual approval for authority grants",
    workflow: "estate-wide",
    summary:
      "Policy tightened after INC-4102. Every authority expansion now requires two signers.",
    outcome: "accepted",
    tags: ["policy", "approval", "governance"],
  },
  {
    id: "INC-4102",
    kind: "incident",
    at: "2026-04-28",
    title: "Marketing agent posted unreviewed copy",
    workflow: "Campaign copy generation",
    summary:
      "A tool grant let the agent publish directly. Low blast radius, but it drove the policy change above.",
    outcome: "resolved",
    timeToCauseMinutes: 4,
    rootCause: "MKT-0455 — publish tool granted without review gate",
    tags: ["authority", "agent", "policy"],
  },
];

export const HISTORY_KIND_STYLE: Record<
  HistoryKind,
  { label: string; text: string; border: string; bg: string }
> = {
  error: { label: "Error", text: "text-fail", border: "border-fail/40", bg: "bg-fail/[0.08]" },
  incident: {
    label: "Incident",
    text: "text-[#d29922]",
    border: "border-[#d29922]/40",
    bg: "bg-[#d29922]/[0.08]",
  },
  audit: { label: "Audit", text: "text-verify", border: "border-verify/40", bg: "bg-verify/[0.08]" },
  change: { label: "Change", text: "text-live", border: "border-live/40", bg: "bg-live/[0.08]" },
};

/** Median minutes to root cause across everything the index resolved. */
export function medianTimeToCause(): number {
  const values = HISTORY.map((h) => h.timeToCauseMinutes).filter(
    (v): v is number => typeof v === "number",
  );
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}
