/**
 * The estate's event stream: what actually happens around one AI change.
 *
 * The pipeline view answers "how does a record get sealed". This answers the
 * question a buyer asks straight after: *what does that look like across all
 * the systems I already run?* So an event here is not an abstraction — it is a
 * commit, a pull request, a CI job, a Jira issue, a Confluence page, a Slack
 * message, a PagerDuty incident, an audit entry, and the links between them.
 *
 * Events are generated deterministically from a fixed seed and a fixed clock,
 * so server and client render identically and the demo never reshuffles under
 * the reader. The `payload` on each event is the "inner workings" panel: the
 * real shape of what that integration writes or receives.
 */

export const TIMELINE_NOW = new Date("2026-07-31T09:15:00.000Z");

/** mulberry32 — deterministic, seeded. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type EventKind =
  | "commit"
  | "pr"
  | "ci"
  | "capture"
  | "policy"
  | "approval"
  | "ticket"
  | "doc"
  | "notify"
  | "seal"
  | "incident"
  | "fix"
  | "audit";

export type System =
  | "GitHub"
  | "Jira"
  | "Confluence"
  | "Slack"
  | "ServiceNow"
  | "PagerDuty"
  | "CooL";

export type Severity = "info" | "warn" | "error" | "ok";

export interface EventRef {
  readonly label: string;
  readonly kind: "commit" | "pr" | "issue" | "page" | "record" | "incident" | "run";
}

export interface TimelineEvent {
  readonly id: string;
  readonly at: Date;
  readonly kind: EventKind;
  readonly system: System;
  readonly actor: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: Severity;
  /** Cross-system identifiers this event carries. */
  readonly refs: readonly EventRef[];
  /** The chain (one AI change) this event belongs to. */
  readonly chainId: string;
  /**
   * What the integration actually wrote or received. Rendered verbatim in the
   * expanded view — this is the "show me the inner workings" payload.
   */
  readonly payload: Record<string, unknown>;
  /** Whether CooL did this without a human. */
  readonly automated: boolean;
  /** Human minutes this event would have cost if done by hand. */
  readonly manualMinutes: number;
}

export interface Chain {
  readonly id: string;
  readonly title: string;
  readonly workflow: string;
  readonly model: string;
  readonly author: string;
  readonly at: Date;
  readonly events: readonly TimelineEvent[];
  /** True if the chain contains an incident. */
  readonly hadIncident: boolean;
  readonly minutesSaved: number;
}

const KIND_META: Record<
  EventKind,
  { label: string; system: System; glyph: string }
> = {
  commit: { label: "Commit", system: "GitHub", glyph: "◆" },
  pr: { label: "Pull request", system: "GitHub", glyph: "⑂" },
  ci: { label: "CI run", system: "GitHub", glyph: "▣" },
  capture: { label: "Change captured", system: "CooL", glyph: "◉" },
  policy: { label: "Policy evaluated", system: "CooL", glyph: "§" },
  approval: { label: "Approval", system: "Jira", glyph: "✓" },
  ticket: { label: "Issue", system: "Jira", glyph: "▤" },
  doc: { label: "Change document", system: "Confluence", glyph: "▦" },
  notify: { label: "Notification", system: "Slack", glyph: "◈" },
  seal: { label: "Evidence sealed", system: "CooL", glyph: "⬢" },
  incident: { label: "Incident", system: "PagerDuty", glyph: "▲" },
  fix: { label: "Remediation", system: "CooL", glyph: "⟳" },
  audit: { label: "Audit entry", system: "ServiceNow", glyph: "▥" },
};

export function kindMeta(kind: EventKind) {
  return KIND_META[kind];
}

const SEED_CHAINS: {
  title: string;
  workflow: string;
  model: string;
  author: string;
  branch: string;
  jira: string;
  hoursAgo: number;
  incident: boolean;
  policy: string;
  approvers: string[];
}[] = [
  {
    title: "Add top-three contributing factors to credit decisions",
    workflow: "retail-lending / adverse-action",
    model: "acme/credit-scorer@2026.07.1",
    author: "p.raman",
    branch: "feat/adverse-action-reasons",
    jira: "LEND-2841",
    hoursAgo: 3,
    incident: false,
    policy: "regulated-credit-decision",
    approvers: ["s.iyer (security)", "d.kapoor (compliance)"],
  },
  {
    title: "Grant support agent refund authority up to ₹5,000",
    workflow: "support / tier-1-autonomy",
    model: "acme/support-agent@2026.07.4",
    author: "m.grover",
    branch: "feat/agent-refund-authority",
    jira: "SUP-1177",
    hoursAgo: 27,
    incident: true,
    policy: "agent-authority-expansion",
    approvers: ["s.iyer (security)"],
  },
  {
    title: "Promote claims-triage model revision to production",
    workflow: "health-claims / prior-auth",
    model: "acme/claims-triage@2026.07.0",
    author: "ci-bot",
    branch: "release/claims-triage-2026.07.0",
    jira: "CLM-0932",
    hoursAgo: 52,
    incident: false,
    policy: "phi-workflow-model-swap",
    approvers: ["a.fernandes (privacy)", "s.iyer (security)"],
  },
];

function hexish(r: () => number, n: number): string {
  const chars = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(r() * 16)];
  return s;
}

/**
 * Build the full event stream.
 *
 * Each chain runs the same spine — commit → PR → CI → capture → policy →
 * approvals → the paperwork → seal → audit — because that IS the product: the
 * spine is identical no matter which team or model triggered it.
 */
export function buildTimeline(seed = 20260731): Chain[] {
  const r = rng(seed);
  const chains: Chain[] = [];

  for (const spec of SEED_CHAINS) {
    const chainId = `chain_${hexish(r, 6)}`;
    const t0 = TIMELINE_NOW.getTime() - spec.hoursAgo * 3_600_000;
    const sha = hexish(r, 7);
    const prNo = 400 + Math.floor(r() * 400);
    const runId = 9_000_000 + Math.floor(r() * 900_000);
    const digest = hexish(r, 16);
    const events: TimelineEvent[] = [];

    let clock = t0;
    const step = (seconds: number) => {
      clock += seconds * 1000;
      return new Date(clock);
    };

    const push = (
      kind: EventKind,
      partial: {
        actor?: string;
        title: string;
        detail: string;
        severity?: Severity;
        refs?: EventRef[];
        payload: Record<string, unknown>;
        automated?: boolean;
        manualMinutes?: number;
        seconds: number;
      },
    ) => {
      events.push({
        id: `${chainId}_${kind}_${events.length}`,
        at: step(partial.seconds),
        kind,
        system: KIND_META[kind].system,
        actor: partial.actor ?? spec.author,
        title: partial.title,
        detail: partial.detail,
        severity: partial.severity ?? "info",
        refs: partial.refs ?? [],
        chainId,
        payload: partial.payload,
        automated: partial.automated ?? true,
        manualMinutes: partial.manualMinutes ?? 0,
      });
    };

    // ---- 1 · the change itself -----------------------------------------
    push("commit", {
      title: spec.title,
      detail: `Pushed to ${spec.branch}. The only human action in this entire chain.`,
      automated: false,
      seconds: 0,
      refs: [
        { label: sha, kind: "commit" },
        { label: spec.branch, kind: "run" },
      ],
      payload: {
        repository: "acme/ai-platform",
        branch: spec.branch,
        sha,
        files_changed: ["prompts/adverse-action.md", "config/model.yaml"],
        diff_summary: "+4 −1",
        signed_off_by: spec.author,
      },
    });

    push("pr", {
      title: `Opened PR #${prNo}`,
      detail: "CooL's GitHub app attaches the AI-change summary to the PR body automatically.",
      seconds: 90,
      refs: [
        { label: `#${prNo}`, kind: "pr" },
        { label: sha, kind: "commit" },
      ],
      manualMinutes: 10,
      payload: {
        number: prNo,
        title: spec.title,
        base: "main",
        head: spec.branch,
        cool_annotation: {
          change_kind: "prompt",
          workflow: spec.workflow,
          model: spec.model,
          policy_matched: spec.policy,
          requires_approval: true,
        },
      },
    });

    push("ci", {
      title: `CI run ${runId} passed`,
      detail: "The CooL action runs inside CI, so capture happens at the deploy gate rather than after the fact.",
      severity: "ok",
      seconds: 240,
      refs: [{ label: `run ${runId}`, kind: "run" }],
      payload: {
        workflow: ".github/workflows/deploy.yml",
        job: "cool-capture",
        steps: [
          { name: "checkout", status: "success" },
          { name: "eval-suite", status: "success", passed: 148, failed: 0 },
          { name: "cool/capture-change@v1", status: "success", duration_ms: 412 },
        ],
        runtime_seconds: 96,
      },
    });

    // ---- 2 · CooL takes over --------------------------------------------
    push("capture", {
      actor: "cool-sdk",
      title: "AI change captured",
      detail: "Async and fail-open. Zero milliseconds added to inference; nothing blocked if CooL were down.",
      seconds: 3,
      refs: [{ label: `rec_${digest.slice(0, 8)}`, kind: "record" }],
      manualMinutes: 15,
      payload: {
        record_schema: "cool.inference.v1",
        change_kind: "prompt",
        model: spec.model,
        workflow: spec.workflow,
        input_commitment: `mh:sha256:${digest}…`,
        capture_mode: "ci + sdk",
        latency_added_ms: 0,
        fail_open: true,
      },
    });

    push("policy", {
      actor: "opa",
      title: `Policy '${spec.policy}' matched`,
      detail: "Open Policy Agent decides what this specific change needs. The rule is versioned and auditable like any other code.",
      severity: "warn",
      seconds: 1,
      refs: [{ label: spec.policy, kind: "record" }],
      payload: {
        engine: "OPA / Rego",
        package: `cool.policy.${spec.policy.replace(/-/g, "_")}`,
        decision: {
          requires_approval: true,
          approvers_required: spec.approvers.length,
          retention_years: 7,
          notify: ["#security-review", "#ai-governance"],
        },
        rule_source: `deny[msg] { input.workflow.sensitivity > 0.6; not input.approvals.security }`,
      },
    });

    for (const [i, approver] of spec.approvers.entries()) {
      push("approval", {
        actor: approver,
        title: `Approved by ${approver}`,
        detail: "The approval task arrived pre-filled with the diff, the matched policy clause and the evidence link.",
        severity: "ok",
        seconds: 900 + i * 1500,
        refs: [{ label: spec.jira, kind: "issue" }],
        automated: false,
        manualMinutes: 20,
        payload: {
          issue: spec.jira,
          approver,
          decision: "approved",
          context_attached: ["diff", "policy_clause", "evidence_link", "eval_results"],
        },
      });
    }

    // ---- 3 · the paperwork, done by machine -----------------------------
    push("ticket", {
      actor: "cool-connector",
      title: `Jira issue ${spec.jira} created and linked`,
      detail: "Opened, populated, linked to the commit and the evidence record, and transitioned — with nobody typing.",
      seconds: 2,
      refs: [
        { label: spec.jira, kind: "issue" },
        { label: `#${prNo}`, kind: "pr" },
      ],
      manualMinutes: 10,
      payload: {
        connector: "atlassian/jira-cloud",
        project: spec.jira.split("-")[0],
        issue_type: "AI Change",
        fields: {
          summary: spec.title,
          workflow: spec.workflow,
          model: spec.model,
          policy: spec.policy,
          evidence: `cool://record/${digest.slice(0, 12)}`,
        },
        remote_links: [`github:acme/ai-platform#${prNo}`, `github:commit/${sha}`],
        transition: "In Review → Approved",
      },
    });

    push("doc", {
      actor: "cool-connector",
      title: "Change document written to Confluence",
      detail: "The document a human would have spent half an hour writing, generated from the captured change itself.",
      seconds: 2,
      refs: [{ label: `AI-CHG-${spec.jira}`, kind: "page" }],
      manualMinutes: 25,
      payload: {
        connector: "atlassian/confluence-cloud",
        space: "AI-GOV",
        page_title: `AI Change — ${spec.title}`,
        sections: [
          "What changed and why",
          "Model and workflow in scope",
          "Policy applied and approvals recorded",
          "Evaluation results",
          "Evidence reference and how to verify it",
        ],
        labels: ["ai-change", "eu-ai-act-art-12", "dpdp-2025"],
        version: 1,
      },
    });

    push("notify", {
      actor: "cool-connector",
      title: "Security and compliance owners notified",
      detail: "The right people told, in the channel they already watch, with the evidence link attached.",
      seconds: 1,
      refs: [{ label: "#ai-governance", kind: "record" }],
      manualMinutes: 5,
      payload: {
        connector: "slack",
        channels: ["#security-review", "#ai-governance"],
        message_blocks: ["change_summary", "policy_decision", "approval_state", "verify_link"],
        mentions: spec.approvers,
      },
    });

    // ---- 4 · the evidence ------------------------------------------------
    push("seal", {
      actor: "cool-evidence",
      title: "Evidence sealed and logged",
      detail: "Hybrid post-quantum signature, appended to the tamper-evident log, offline-verifiable from this moment on.",
      severity: "ok",
      seconds: 1,
      refs: [{ label: `mh:sha256:${digest.slice(0, 10)}…`, kind: "record" }],
      manualMinutes: 30,
      payload: {
        binding_hash: `mh:sha256:${digest}`,
        signature_alg: "ml-dsa-65+ed25519",
        ml_dsa_bytes: 3309,
        ed25519_bytes: 64,
        log: { id: "acme-prod", leaf_index: events.length, tree_size: 4821 },
        attestation: "mock",
        anchor: "absent",
        verifiable_offline: true,
      },
    });

    // ---- 5 · when it goes wrong ------------------------------------------
    if (spec.incident) {
      push("incident", {
        actor: "pagerduty",
        title: "Refund volume anomaly detected",
        detail: "Refunds issued without escalation rose 6× within four hours of the authority change taking effect.",
        severity: "error",
        seconds: 14_400,
        refs: [
          { label: "INC-4471", kind: "incident" },
          { label: spec.jira, kind: "issue" },
        ],
        payload: {
          detector: "cool.anomaly.authority_usage",
          baseline_per_hour: 4.2,
          observed_per_hour: 25.8,
          z_score: 6.1,
          suspected_cause: `${spec.jira} — agent authority expanded without a spend ceiling`,
          blast_radius_workflows: 4,
        },
      });

      push("fix", {
        actor: "cool-remediation",
        title: "Root cause identified from the change lineage",
        detail:
          "Because every change is indexed, the search from symptom to cause took one query instead of a war room.",
        severity: "ok",
        seconds: 300,
        refs: [
          { label: "INC-4471", kind: "incident" },
          { label: sha, kind: "commit" },
        ],
        manualMinutes: 180,
        payload: {
          query: "workflow:support/tier-1-autonomy AND kind:tools AND at:[-6h]",
          matched_change: spec.jira,
          time_to_root_cause_seconds: 41,
          recommended: [
            "Roll back the authority grant to the previous version",
            "Re-apply with a per-transaction ceiling and dual approval",
            "Add an authority-usage alert threshold to the workflow policy",
          ],
          rollback_target: "acme/support-agent@2026.07.3",
        },
      });
    }

    // ---- 6 · the audit trail ---------------------------------------------
    push("audit", {
      actor: "cool-audit",
      title: "Indexed into the audit register",
      detail:
        "Filed against every regime this workflow falls under, retention clock started, and searchable from the day it lands.",
      seconds: 60,
      refs: [{ label: `AUD-${spec.jira}`, kind: "record" }],
      manualMinutes: 20,
      payload: {
        connector: "servicenow/grc",
        register: "AI Change Register",
        regimes: ["EU AI Act · Article 12", "DPDP Rules 2025"],
        retention_until: "2033-07-31",
        evidence_ref: `mh:sha256:${digest}`,
        export_ready: true,
      },
    });

    const minutesSaved = events
      .filter((e) => e.automated)
      .reduce((s, e) => s + e.manualMinutes, 0);

    chains.push({
      id: chainId,
      title: spec.title,
      workflow: spec.workflow,
      model: spec.model,
      author: spec.author,
      at: new Date(t0),
      events,
      hadIncident: spec.incident,
      minutesSaved,
    });
  }

  return chains.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** Relative time against the fixed timeline clock (SSR-stable). */
export function since(date: Date): string {
  const mins = Math.round((TIMELINE_NOW.getTime() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Clock time, for the timeline gutter. */
export function clockOf(date: Date): string {
  return date.toISOString().slice(11, 16);
}
