"use client";

import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ShieldCheck,
  TriangleAlert,
  Scale,
  FileDown,
  Search,
  Zap,
  Check,
  X,
} from "lucide-react";
import {
  ago,
  buildEstate,
  compliancePosture,
  dailyVolume,
  summarise,
  WORKFLOWS,
  type AIChange,
} from "@/lib/dashboard/estate";
import { BAND_STYLE, FEATURE_MODEL } from "@/lib/dashboard/risk";
import {
  ApprovalChip,
  EvidenceChip,
  Kpi,
  Meter,
  Panel,
  RiskBadge,
  Sparkline,
} from "./parts";

/**
 * The CooL console — the product a customer opens on Monday morning.
 *
 * The estate below is synthetic (and labelled as such on screen), but every
 * number derived from it is computed by the real code: the risk model, the
 * rankings, the compliance coverage and the resolution advice all run here.
 * Point the same components at a live change feed and nothing about them
 * changes.
 */

type Tab = "overview" | "changes" | "risk" | "compliance";

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "changes", label: "Changes", icon: ShieldCheck },
  { id: "risk", label: "Risk & fixes", icon: TriangleAlert },
  { id: "compliance", label: "Compliance", icon: Scale },
];

/** Minutes → a human phrase like "4h 30m" or "12 days". */
function humanMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = mins / 60;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  const days = hours / 8; // working days
  return `${days.toFixed(days < 10 ? 1 : 0)} work-days`;
}

export default function Console() {
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AIChange | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [exported, setExported] = useState(false);

  // Built once — deterministic, so this is stable across renders.
  const changes = useMemo(() => buildEstate(), []);
  const summary = useMemo(() => summarise(changes), [changes]);
  const volume = useMemo(() => dailyVolume(changes), [changes]);
  const posture = useMemo(() => compliancePosture(changes), [changes]);

  const ranked = useMemo(
    () => [...changes].sort((a, b) => b.risk.probability - a.risk.probability),
    [changes],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return changes;
    return changes.filter(
      (c) =>
        c.workflow.name.toLowerCase().includes(q) ||
        c.modelId.toLowerCase().includes(q) ||
        c.actor.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.kindLabel.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [changes, query]);

  const openQueue = useMemo(
    () => ranked.filter((c) => c.risk.band === "critical" || c.risk.band === "high"),
    [ranked],
  );

  const resolveOne = useCallback((id: string) => {
    setResolved((prev) => new Set(prev).add(id));
  }, []);

  /** Build a real, downloadable audit package from the estate in scope. */
  const exportAudit = useCallback(() => {
    const pkg = {
      generated_for: "Demo Enterprise Pvt. Ltd.",
      generated_at: new Date().toISOString(),
      note:
        "Synthetic demo estate. Structure matches the production export; receipts in a real package are cool.receipt.v1 envelopes verifiable offline.",
      scope: {
        changes: changes.length,
        workflows: summary.workflowsGoverned,
        providers: summary.providers,
      },
      posture,
      entries: changes.map((c) => ({
        change_id: c.id,
        at: c.at.toISOString(),
        actor: c.actor,
        workflow: c.workflow.name,
        regimes: c.workflow.regimes,
        model: c.modelId,
        provider: c.provider,
        kind: c.kind,
        summary: c.summary,
        environment: c.env,
        evidence_state: c.evidence,
        approval_state: c.approval,
        binding_digest: `mh:sha256:${c.digest}…`,
        risk: {
          probability: Number(c.risk.probability.toFixed(4)),
          band: c.risk.band,
          top_drivers: c.risk.contributions
            .slice(0, 3)
            .map((d) => ({ feature: d.key, contribution: Number(d.contribution.toFixed(3)) })),
        },
      })),
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cool-audit-package.json";
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2200);
  }, [changes, posture, summary]);

  return (
    <div className="w-full">
      {/* ── tabs ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[12px] transition-colors",
                active
                  ? "border-verify/55 bg-verify/15 text-ink"
                  : "border-line text-mist hover:border-verify/40 hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
              {t.id === "risk" && openQueue.length > 0 ? (
                <span className="rounded-full bg-fail/20 px-1.5 py-px font-mono text-[10px] text-fail">
                  {openQueue.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {/* ── OVERVIEW ───────────────────────────────────────────────── */}
        {tab === "overview" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                value={String(summary.total)}
                label="AI changes governed"
                sub={`${summary.last7d} in the last 7 days`}
              />
              <Kpi
                value={`${summary.sealedPct}%`}
                label="Sealed as evidence"
                sub={`${summary.sealed} of ${summary.total} tamper-proof`}
                tone="live"
              />
              <Kpi
                value={humanMinutes(summary.minutesSaved)}
                label="Manual work avoided"
                sub="vs. documenting each change by hand"
                tone="live"
              />
              <Kpi
                value={String(summary.criticalOrHigh)}
                label="Changes needing action"
                sub={`${summary.overdueApprovals} approvals overdue`}
                tone={summary.criticalOrHigh > 0 ? "warn" : "live"}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              <Panel
                title="Change velocity"
                hint="Every prompt, model, parameter and tool change across the estate — 21 days."
              >
                <Sparkline data={volume} />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-mono text-[11px] text-mist">Workflows</p>
                    <p className="mt-0.5 font-mono text-[15px] text-ink">
                      {summary.workflowsGoverned}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-mist">Providers</p>
                    <p className="mt-0.5 font-mono text-[15px] text-ink">
                      {summary.providers}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-mist">Peak day</p>
                    <p className="mt-0.5 font-mono text-[15px] text-ink">
                      {Math.max(...volume)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-mist">
                  Every one of these used to drag documentation, approval,
                  governance updates and audit filing behind it. None of them did
                  this month.
                </p>
              </Panel>

              <Panel
                title="Needs you today"
                hint="Ranked by modelled probability of an incident or audit finding."
              >
                <div className="space-y-2">
                  {openQueue.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelected(c);
                        setTab("risk");
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-line bg-panel/40 px-3 py-2.5 text-left transition-colors hover:border-verify/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[12px] text-ink">
                          {c.workflow.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-mist">
                          {c.kindLabel} · {c.actor} · {ago(c.at)}
                        </span>
                      </span>
                      <RiskBadge band={c.risk.band} probability={c.risk.probability} />
                    </button>
                  ))}
                  {openQueue.length === 0 ? (
                    <p className="text-[13px] text-mist">
                      Nothing above the elevated threshold. The estate is clean.
                    </p>
                  ) : null}
                </div>
                {summary.recoverableMinutes > 0 ? (
                  <p className="mt-3 rounded-lg border border-live/35 bg-live/[0.07] px-3 py-2 text-[12.5px] leading-snug text-fog">
                    <span className="text-live">
                      {humanMinutes(summary.recoverableMinutes)}
                    </span>{" "}
                    of this queue can be cleared automatically.
                  </p>
                ) : null}
              </Panel>
            </div>

            <Panel
              title="Governed workflows"
              hint="Sensitivity and dependants drive how hard each one is gated."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {WORKFLOWS.map((w) => {
                  const wfChanges = changes.filter((c) => c.workflow.id === w.id);
                  return (
                    <div
                      key={w.id}
                      className="rounded-lg border border-line bg-panel/40 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 font-mono text-[12px] text-ink">{w.name}</p>
                        <span className="shrink-0 font-mono text-[11px] text-mist">
                          {wfChanges.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-mist">{w.unit}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] text-mist">SENS</span>
                        <Meter
                          value={w.sensitivity * 100}
                          tone={w.sensitivity > 0.7 ? "warn" : "verify"}
                          className="flex-1"
                        />
                        <span className="w-8 shrink-0 text-right font-mono text-[10px] text-mist">
                          {Math.round(w.sensitivity * 100)}
                        </span>
                      </div>
                      {w.regimes.length ? (
                        <p className="mt-1.5 font-mono text-[10.5px] leading-snug text-mist">
                          {w.regimes.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        ) : null}

        {/* ── CHANGES ────────────────────────────────────────────────── */}
        {tab === "changes" ? (
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2">
                <Search className="size-3.5 shrink-0 text-mist" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by workflow, model, author, or change id…"
                  className="w-full bg-transparent font-mono text-[12.5px] text-ink outline-none placeholder:text-mist"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="shrink-0 text-mist hover:text-ink"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-[11px] text-mist">
                {filtered.length} of {changes.length} changes · every one
                searchable because every one was captured automatically
              </p>
            </Panel>

            <div className="frost overflow-hidden rounded-2xl border border-line">
              <div className="hidden gap-3 border-b border-line px-4 py-2.5 font-mono text-[10.5px] tracking-[0.12em] text-mist uppercase lg:grid lg:grid-cols-[1.6fr_1fr_0.7fr_0.7fr_0.8fr]">
                <span>Change</span>
                <span>Model</span>
                <span>Evidence</span>
                <span>Approval</span>
                <span className="text-right">Risk</span>
              </div>
              <div className="max-h-[560px] overflow-y-auto">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelected(c)}
                    className="grid w-full gap-1 border-b border-line/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-verify/[0.05] lg:grid-cols-[1.6fr_1fr_0.7fr_0.7fr_0.8fr] lg:items-center lg:gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12.5px] text-ink">
                        {c.summary}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-mist">
                        {c.workflow.name} · {c.kindLabel} · {c.actor} · {ago(c.at)}
                      </span>
                    </span>
                    <span className="min-w-0 font-mono text-[11.5px] text-fog">
                      <span className="block truncate">{c.modelId}</span>
                      <span className="block truncate text-[10.5px] text-mist">
                        {c.env}
                      </span>
                    </span>
                    <span>
                      <EvidenceChip state={c.evidence} />
                    </span>
                    <span>
                      <ApprovalChip state={c.approval} />
                    </span>
                    <span className="lg:text-right">
                      <RiskBadge band={c.risk.band} probability={c.risk.probability} />
                    </span>
                  </button>
                ))}
                {filtered.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px] text-mist">
                    Nothing matches that search.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── RISK & FIXES ───────────────────────────────────────────── */}
        {tab === "risk" ? (
          <div className="space-y-4">
            <Panel
              title="How this score works"
              hint="A logistic model over eight signals, with fixed published weights. Every score below can be opened and traced to the features that caused it."
            >
              <div className="grid gap-1.5 sm:grid-cols-2">
                {FEATURE_MODEL.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-panel/40 px-3 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-fog">
                      {f.label}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-verify">
                      ×{f.weight.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-mist">
                These weights are priors set from the failure modes the system is
                built around — they are not fitted on customer data, because there
                isn&apos;t any yet. In deployment they are re-fit per tenant against
                that tenant&apos;s own incident history.
              </p>
            </Panel>

            <div className="space-y-3">
              {ranked.slice(0, 12).map((c) => {
                const isResolved = resolved.has(c.id);
                const s = BAND_STYLE[c.risk.band];
                return (
                  <div
                    key={c.id}
                    className={clsx(
                      "frost rounded-2xl border p-4 transition-colors sm:p-5",
                      isResolved ? "border-live/40" : s.border,
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <RiskBadge band={c.risk.band} probability={c.risk.probability} />
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-live/45 bg-live/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-live uppercase">
                              <Check className="size-3" /> Actioned
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 font-mono text-[13.5px] text-ink">{c.summary}</p>
                        <p className="mt-1 text-[12.5px] text-mist">
                          {c.workflow.name} · {c.modelId} · {c.actor} · {ago(c.at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-right">
                        <span className={clsx("display text-[2rem] leading-none", s.text)}>
                          {Math.round(c.risk.probability * 100)}%
                        </span>
                        <span className="mt-1 block font-mono text-[10px] text-mist">
                          modelled incident risk
                        </span>
                      </p>
                    </div>

                    {/* why — the explainability that makes it actionable */}
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="font-mono text-[11px] tracking-[0.12em] text-mist uppercase">
                          What drove it
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {c.risk.contributions
                            .filter((d) => d.contribution > 0.05)
                            .slice(0, 4)
                            .map((d) => (
                              <div key={d.key}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="min-w-0 truncate font-mono text-[11.5px] text-fog">
                                    {d.label}
                                  </span>
                                  <span className="shrink-0 font-mono text-[10.5px] text-mist">
                                    {Math.round(d.share * 100)}%
                                  </span>
                                </div>
                                <Meter
                                  value={d.share * 100}
                                  tone={
                                    c.risk.band === "critical"
                                      ? "fail"
                                      : c.risk.band === "high"
                                        ? "warn"
                                        : "verify"
                                  }
                                  className="mt-1"
                                />
                              </div>
                            ))}
                        </div>
                        <p className="mt-2 text-[12px] leading-snug text-mist">
                          Chiefly because {c.risk.contributions[0]?.because}.
                        </p>
                      </div>

                      <div>
                        <p className="font-mono text-[11px] tracking-[0.12em] text-mist uppercase">
                          What to do
                        </p>
                        <div className="mt-2 space-y-2">
                          {c.risk.resolutions.map((r) => (
                            <div
                              key={r.title}
                              className="rounded-lg border border-line bg-panel/40 px-3 py-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="min-w-0 font-mono text-[12px] text-ink">
                                  {r.title}
                                </p>
                                <span
                                  className={clsx(
                                    "shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] tracking-[0.1em]",
                                    r.automatable
                                      ? "border-live/45 bg-live/10 text-live"
                                      : "border-mock/40 text-mock",
                                  )}
                                >
                                  {r.automatable ? "AUTO" : "HUMAN"}
                                </span>
                              </div>
                              <p className="mt-1 text-[12px] leading-snug text-mist">
                                {r.detail}
                              </p>
                              <p className="mt-1 font-mono text-[10.5px] text-live">
                                ~{r.minutesSaved} min saved
                              </p>
                            </div>
                          ))}
                          {c.risk.resolutions.length === 0 ? (
                            <p className="text-[12.5px] text-mist">
                              No material drivers — nothing to action.
                            </p>
                          ) : null}
                        </div>

                        {c.risk.resolutions.some((r) => r.automatable) && !isResolved ? (
                          <button
                            type="button"
                            onClick={() => resolveOne(c.id)}
                            className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-live/45 bg-live/10 px-3.5 py-2 font-mono text-[11.5px] text-live transition-colors hover:bg-live/20"
                          >
                            <Zap className="size-3.5" /> Apply the automatic fixes
                          </button>
                        ) : null}
                        {isResolved ? (
                          <p className="mt-2.5 font-mono text-[11.5px] text-live">
                            ✓ Workflow dispatched · approvals requested, evidence
                            re-sealed, owners notified
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ── COMPLIANCE ─────────────────────────────────────────────── */}
        {tab === "compliance" ? (
          <div className="space-y-4">
            <Panel
              title="Regulatory posture"
              hint="Coverage is measured, not asserted: a change counts as evidenced only when it is sealed and not blocked on an overdue approval."
            >
              <div className="space-y-3">
                {posture.map((p) => (
                  <div key={p.regime} className="rounded-lg border border-line bg-panel/40 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-mono text-[12.5px] text-ink">{p.regime}</p>
                      <p
                        className={clsx(
                          "font-mono text-[12px]",
                          p.pct >= 95 ? "text-live" : p.pct >= 80 ? "text-verify" : "text-[#d29922]",
                        )}
                      >
                        {p.pct}% evidenced
                      </p>
                    </div>
                    <Meter
                      value={p.pct}
                      tone={p.pct >= 95 ? "live" : p.pct >= 80 ? "verify" : "warn"}
                      className="mt-2"
                    />
                    <p className="mt-2 text-[12px] leading-snug text-mist">{p.requirement}</p>
                    <p className="mt-1 font-mono text-[11px] text-fog">
                      {p.evidenced} of {p.inScope} changes in scope
                      {p.gaps > 0 ? ` · ${p.gaps} gap${p.gaps === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Audit package"
              hint="What an auditor receives. One click, no scramble."
              action={
                <button
                  type="button"
                  onClick={exportAudit}
                  className="inline-flex items-center gap-2 rounded-full border border-verify/45 bg-verify/10 px-3.5 py-2 font-mono text-[11.5px] text-ink transition-colors hover:bg-verify/20"
                >
                  {exported ? (
                    <>
                      <Check className="size-3.5 text-live" /> Downloaded
                    </>
                  ) : (
                    <>
                      <FileDown className="size-3.5" /> Export
                    </>
                  )}
                </button>
              }
            >
              <p className="text-[13px] leading-relaxed text-fog">
                The package carries every change in scope, its evidence state, its
                approval trail, the regimes it falls under, and the risk assessment
                with its drivers. In a live tenant each entry also carries the
                signed <span className="font-mono text-[12px] text-ink">cool.receipt.v1</span>{" "}
                envelope, so the auditor verifies it offline without asking you —
                or us — for anything.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["Evidence entries", String(summary.total)],
                  ["Workflows in scope", String(summary.workflowsGoverned)],
                  ["Providers covered", String(summary.providers)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-panel/40 px-3 py-2">
                    <p className="font-mono text-[15px] text-ink">{value}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] tracking-[0.1em] text-mist uppercase">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-mist">
                Preparing this by hand is the fire drill CooL exists to delete —
                weeks of chasing screenshots, tickets and Slack threads, replaced
                by a file that was already complete before anyone asked.
              </p>
            </Panel>
          </div>
        ) : null}
      </div>

      {/* ── change detail drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.aside
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong h-full w-full max-w-lg overflow-y-auto p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <RiskBadge
                    band={selected.risk.band}
                    probability={selected.risk.probability}
                  />
                  <h3 className="mt-2 font-mono text-[15px] leading-snug text-ink">
                    {selected.summary}
                  </h3>
                  <p className="mt-1 text-[12.5px] text-mist">
                    {selected.workflow.name} · {selected.workflow.unit}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-full border border-line p-1.5 text-mist transition-colors hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <dl className="mt-4 space-y-2">
                {[
                  ["Change id", selected.id],
                  ["Type", selected.kindLabel],
                  ["Model", `${selected.modelId} (${selected.provider})`],
                  ["Author", selected.actor],
                  ["Environment", selected.env],
                  ["When", `${ago(selected.at)} · ${selected.at.toISOString()}`],
                  ["Binding digest", `mh:sha256:${selected.digest}…`],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 border-b border-line/60 pb-2">
                    <dt className="w-28 shrink-0 font-mono text-[11px] tracking-[0.1em] text-mist uppercase">
                      {k}
                    </dt>
                    <dd className="min-w-0 flex-1 font-mono text-[12px] break-all text-fog">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap gap-3">
                <EvidenceChip state={selected.evidence} />
                <ApprovalChip state={selected.approval} />
              </div>

              <div className="mt-5">
                <p className="font-mono text-[11px] tracking-[0.12em] text-mist uppercase">
                  Risk drivers
                </p>
                <div className="mt-2 space-y-1.5">
                  {selected.risk.contributions.map((d) => (
                    <div key={d.key}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-mono text-[11.5px] text-fog">
                          {d.label}
                        </span>
                        <span className="shrink-0 font-mono text-[10.5px] text-mist">
                          {d.weight.toFixed(1)} × {d.value.toFixed(2)} ={" "}
                          {d.contribution.toFixed(2)}
                        </span>
                      </div>
                      <Meter value={d.share * 100} className="mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {selected.risk.resolutions.length ? (
                <div className="mt-5">
                  <p className="font-mono text-[11px] tracking-[0.12em] text-mist uppercase">
                    Recommended
                  </p>
                  <div className="mt-2 space-y-2">
                    {selected.risk.resolutions.map((r) => (
                      <div
                        key={r.title}
                        className="rounded-lg border border-line bg-panel/40 px-3 py-2"
                      >
                        <p className="font-mono text-[12px] text-ink">{r.title}</p>
                        <p className="mt-1 text-[12px] leading-snug text-mist">{r.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selected.workflow.regimes.length ? (
                <div className="mt-5">
                  <p className="font-mono text-[11px] tracking-[0.12em] text-mist uppercase">
                    In scope for
                  </p>
                  <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-fog">
                    {selected.workflow.regimes.join(" · ")}
                  </p>
                </div>
              ) : null}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
