"use client";

/**
 * The console, as the product actually looks.
 *
 * The previous version of this page was a marketing rendering of a dashboard:
 * one long scroll of sections, styled like the deck around it. This is the
 * application shell — a fixed left rail, a tenant bar, and views you switch
 * between — because the thing a buyer is trying to picture is not "a page about
 * the product", it is "the screen my team has open on Monday".
 *
 * Views are client-side state rather than routes. The whole estate is already
 * in memory and every view reads the same slice of it, so a route change would
 * buy nothing and cost a navigation. It also keeps `/dashboard` a single
 * indexable URL.
 *
 * The estate is synthetic and the banner says so. Everything computed from it —
 * the risk model, the rankings, the compliance mapping, the aggregates — is the
 * production code path running in your browser.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CHANGE_KINDS,
  KIND_SHORT,
  buildEstate,
  compliancePosture,
  dailyBuckets,
  estateDrivers,
  providerMix,
  riskDistribution,
  rollupByWorkflow,
  summarise,
  WORKFLOWS,
  ESTATE_NOW,
  type AIChange,
} from "@/lib/dashboard/estate";
import { bandFor, FEATURE_MODEL, INTERCEPT } from "@/lib/dashboard/risk";
import { CONNECTORS } from "@/lib/demo/integrations";
import { SERIES, STATUS, severityToken, SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/console-theme";
import type { StatusRole } from "@/lib/console-theme";
import { ago, compact, fullDate, num, pct, shortDate, workDays } from "@/lib/console-format";
import { ColumnChart } from "./ColumnChart";
import { BarList } from "./BarList";
import { Donut } from "./Donut";
import { Heatmap } from "./Heatmap";
import { Meter } from "./Meter";
import { Sparkline } from "./Sparkline";
import { ContributionBars } from "./ContributionBars";
import { Button } from "./hud";

/* ── the estate, built once ───────────────────────────────────────────── */

const ESTATE = buildEstate(64);

/* ── shared bits ──────────────────────────────────────────────────────── */

/**
 * A panel. Square, hairline-bordered, opaque.
 *
 * `brackets` adds the four HUD corner marks and `accent` makes them blue. Both
 * opt-in, because their whole value is scarcity: bracket every card and the
 * reader stops seeing them, which spends the ink and buys no emphasis.
 */
function Card({
  children,
  className = "",
  padded = true,
  brackets = false,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  brackets?: boolean;
  accent?: boolean;
}) {
  return (
    <section
      className={[
        "relative border border-line bg-panel",
        padded ? "p-4 sm:p-5" : "",
        brackets ? "hud-brackets" : "",
        accent ? "hud-brackets-accent" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[12px] text-mist">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

/**
 * A status chip. Always glyph + text — colour is the third channel, never the
 * only one, so this survives colour-vision deficiency and grayscale print.
 */
function Badge({
  role,
  children,
  title,
}: {
  role: StatusRole;
  children: React.ReactNode;
  title?: string;
}) {
  const token = STATUS[role];
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-medium ${token.border} ${token.bg} ${token.text}`}
    >
      <span aria-hidden className="text-[10px] leading-none">
        {token.glyph}
      </span>
      {children}
    </span>
  );
}

function StatTile({
  label,
  value,
  unit,
  note,
  trend,
  emphasis = false,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  trend?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`hud-lift relative border p-4 ${
        emphasis
          ? "hud-brackets hud-brackets-accent border-verify/35 bg-verify/[0.06]"
          : "border-line bg-panel"
      }`}
    >
      {/* Monospace, wide-tracked, uppercase — a channel name on an instrument,
          not a sentence. It separates the label tier from body copy at a glance. */}
      <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-mist uppercase">
        {label}
      </p>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        {/* Proportional figures, not tabular: equal-width digits make a number
            like 121 look loose at display sizes. */}
        <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">
          {value}
          {unit ? <span className="ml-1 text-[13px] font-normal text-mist">{unit}</span> : null}
        </p>
        {trend}
      </div>
      {note ? <p className="mt-2 text-[12px] text-mist">{note}</p> : null}
    </div>
  );
}

const SEVERITY_ROLE: Record<string, StatusRole> = {
  low: "good",
  elevated: "info",
  high: "serious",
  critical: "critical",
};

const EVIDENCE_ROLE: Record<AIChange["evidence"], StatusRole> = {
  sealed: "good",
  sealing: "info",
  unattested: "critical",
};

const EVIDENCE_LABEL: Record<AIChange["evidence"], string> = {
  sealed: "Sealed",
  sealing: "Sealing",
  unattested: "Unattested",
};

const APPROVAL_ROLE: Record<AIChange["approval"], StatusRole> = {
  approved: "good",
  pending: "info",
  overdue: "serious",
  "not-required": "absent",
};

const APPROVAL_LABEL: Record<AIChange["approval"], string> = {
  approved: "Approved",
  pending: "Pending",
  overdue: "Overdue",
  "not-required": "Not required",
};

/* ── navigation ───────────────────────────────────────────────────────── */

type ViewId = "overview" | "changes" | "workflows" | "risk" | "connectors" | "compliance";

const NAV: readonly { group: string; items: readonly { id: ViewId; label: string; glyph: string }[] }[] = [
  {
    group: "Operate",
    items: [
      { id: "overview", label: "Overview", glyph: "◲" },
      { id: "changes", label: "Change feed", glyph: "≡" },
      { id: "workflows", label: "Workflows", glyph: "⊞" },
    ],
  },
  {
    group: "Anticipate",
    items: [{ id: "risk", label: "Predictive risk", glyph: "◈" }],
  },
  {
    group: "Connect",
    items: [{ id: "connectors", label: "Connectors", glyph: "⇄" }],
  },
  {
    group: "Prove",
    items: [{ id: "compliance", label: "Compliance", glyph: "§" }],
  },
];

const VIEW_LEDE: Record<ViewId, { title: string; lede: string }> = {
  overview: {
    title: "Overview",
    lede: "Every AI change across the estate, scored before it bites, with the evidence already sealed.",
  },
  changes: {
    title: "Change feed",
    lede: "Every prompt edit, model swap, parameter change, tool grant and policy update — captured as it happens.",
  },
  workflows: {
    title: "Workflows",
    lede: "The AI systems under governance: what each touches, who owns it, and how well its changes are evidenced.",
  },
  risk: {
    title: "Predictive risk",
    lede: "A logistic model over eight published signals. Every score decomposes into the features that caused it.",
  },
  connectors: {
    title: "Connectors",
    lede: "What CooL reads from the systems you already run — and, where the value is, what it writes back.",
  },
  compliance: {
    title: "Compliance",
    lede: "Posture per regime, derived from the changes actually in scope rather than from a questionnaire.",
  },
};

/* ── the app ──────────────────────────────────────────────────────────── */

export default function ConsoleApp() {
  const [view, setView] = useState<ViewId>("overview");

  const summary = useMemo(() => summarise(ESTATE), []);
  const buckets = useMemo(() => dailyBuckets(ESTATE, 21), []);
  const distribution = useMemo(() => riskDistribution(ESTATE), []);
  const drivers = useMemo(() => estateDrivers(ESTATE), []);
  const providers = useMemo(() => providerMix(ESTATE), []);
  const rollups = useMemo(() => rollupByWorkflow(ESTATE), []);
  const posture = useMemo(() => compliancePosture(ESTATE), []);

  return (
    // `.hud` re-declares the palette and zeroes every radius token for this
    // subtree only. The deck around it keeps its own colours and soft corners.
    <div className="hud overflow-hidden border border-line bg-void shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      <div className="flex min-h-[720px]">
        {/* ── left rail ── */}
        <aside className="hidden w-52 shrink-0 border-r border-line bg-panel lg:block">
          <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
            <span
              aria-hidden
 className="grid size-6 place-items-center border border-verify/40 bg-verify/[0.12] text-[11px] font-bold text-verify"
            >
              C
            </span>
            <span className="text-[13px] font-semibold tracking-tight text-ink">CooL</span>
            <span className="ml-auto border border-line px-1.5 py-0.5 text-[10px] text-mist">
              Console
            </span>
          </div>

          <nav aria-label="Console sections" className="px-2 py-3">
            {NAV.map((group) => (
              <div key={group.group} className="mb-4 last:mb-0">
                <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-mist uppercase">
                  {group.group}
                </p>
                <ul>
                  {group.items.map((item) => {
                    const active = view === item.id;
                    return (
                      <li key={item.id}>
                        <button
 type="button"
                          onClick={() => setView(item.id)}
                          aria-current={active ? "page" : undefined}
                          className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors ${
                            active
                              ? "bg-verify/[0.13] font-medium text-ink"
                              : "text-fog hover:bg-raised hover:text-ink"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`w-4 text-center text-[13px] ${active ? "text-verify" : "text-mist"}`}
                          >
                            {item.glyph}
                          </span>
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-5 border-t border-line px-3 pt-4">
              <Link
 href="/demo"
 className="flex items-center gap-2.5 text-[13px] text-verify transition-colors hover:text-ink"
              >
                <span aria-hidden className="w-4 text-center">
                  ⛨
                </span>
                Evidence, live
              </Link>
              <p className="mt-2 text-[11px] leading-relaxed text-mist">
                Real cryptography, running in your browser.
              </p>
            </div>
          </nav>
        </aside>

        {/* ── main ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* top bar */}
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">Acme Financial Group</p>
              <p className="truncate text-[11px] text-mist">
                {WORKFLOWS.length} governed workflows · {summary.providers} providers
              </p>
            </div>
            <span className="ml-2 hidden items-center gap-1.5 border border-live/40 bg-live/[0.10] px-2 py-0.5 text-[11px] text-live sm:inline-flex">
              <span aria-hidden>✓</span> Production
            </span>
            <p className="ml-auto hidden text-[11px] text-mist md:block">
              {fullDate(ESTATE_NOW)}
            </p>
          </div>

          {/* mobile view switcher — the rail is desktop-only */}
          <div className="table-scroll border-b border-line px-3 py-2 lg:hidden">
            <div className="flex gap-1.5">
              {NAV.flatMap((g) => g.items).map((item) => (
                <button
                  key={item.id}
 type="button"
                  onClick={() => setView(item.id)}
                  className={`shrink-0 border px-2.5 py-1 text-[12px] transition-colors ${
                    view === item.id
                      ? "border-verify/50 bg-verify/[0.14] text-ink"
                      : "border-line text-mist"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <header className="mb-5">
              <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                {VIEW_LEDE[view].title}
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] text-fog">{VIEW_LEDE[view].lede}</p>
            </header>

            {/* ── OVERVIEW ── */}
            {view === "overview" ? (
              <div className="space-y-4">
                {/* The one number this view leads with — and the only panel on
                    it that earns accent brackets. */}
                <Card brackets accent>
                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <p className="text-[44px] leading-none font-semibold tracking-[-0.03em] text-ink">
                        {summary.sealedPct}%
                      </p>
                      <p className="mt-2 max-w-md text-[13px] text-fog">
                        {num(summary.sealed)} of {num(summary.total)} changes carry sealed,
                        offline-verifiable evidence.
                      </p>
                      <p className="mt-1 text-[12px] text-mist">
                        {summary.unattested} unattested · {summary.overdueApprovals} approvals
                        overdue
                      </p>
                    </div>
                    <div className="w-full max-w-xs">
                      <Meter
                        value={summary.sealedPct}
                        color={STATUS.good.hex}
                        height={10}
                        label={`Evidence coverage: ${summary.sealedPct} percent`}
                      />
                      <div className="mt-2 flex justify-between text-[11px] text-mist">
                        <span>Evidence coverage</span>
                        <span className="tnum">target 95%</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
 label="Changes, last 7 days"
                    value={num(summary.last7d)}
                    trend={
                      <Sparkline
                        values={buckets.slice(-14).map((b) => b.total)}
                        color={SERIES[0]}
 label="Daily change volume over the last 14 days"
                      />
                    }
                  />
                  <StatTile
 label="High or critical risk"
                    value={num(summary.criticalOrHigh)}
                    note={`${pct(summary.criticalOrHigh / Math.max(1, summary.total))} of the feed`}
                    emphasis={summary.criticalOrHigh > 0}
                  />
                  <StatTile
 label="Approvals outstanding"
                    value={num(summary.pendingApprovals + summary.overdueApprovals)}
                    note={`${summary.overdueApprovals} past SLA`}
                  />
                  <StatTile
 label="Time returned"
                    value={String(workDays(summary.minutesSaved))}
 unit="days"
 note="of manual change-record work removed"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <Card className="xl:col-span-2">
                    <ColumnChart
 title="Change activity"
 subtitle="Daily volume by change type, last 21 days"
                      categories={buckets.map((b) => shortDate(b.date))}
                      series={CHANGE_KINDS.map((kind, i) => ({
                        label: KIND_SHORT[kind],
                        color: SERIES[i]!,
                        values: buckets.map((b) => b.byKind[kind]),
                      }))}
                      labelEvery={3}
                      height={210}
                    />
                  </Card>
                  <Card>
                    <Donut
 title="Risk distribution"
 subtitle="Modelled probability of an incident or audit finding"
                      centreValue={num(summary.total)}
 centreLabel="changes scored"
                      slices={SEVERITY_ORDER.map((band) => ({
                        label: SEVERITY_LABEL[band],
                        value: distribution[band],
                        color: severityToken(band).hex,
                      }))}
                    />
                  </Card>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <BarList
 title="What is driving estate risk"
 subtitle="Every change's feature contributions, summed across the feed"
 valueLabel="Share of total risk push"
 format="decimal1"
                      rows={drivers.slice(0, 6).map((d) => ({
                        label: d.label,
                        value: Math.round(d.share * 1000) / 10,
                        note: d.because,
                        meta: "%",
                      }))}
                    />
                  </Card>
                  <Card>
                    <BarList
 title="Provider mix"
 subtitle="Which vendors are serving governed traffic"
 valueLabel="Changes"
                      rows={providers.map((p) => ({
                        label: p.provider,
                        value: p.count,
                        meta: pct(p.share),
                      }))}
                    />
                  </Card>
                </div>
              </div>
            ) : null}

            {/* ── CHANGE FEED ── */}
            {view === "changes" ? <ChangeFeed changes={ESTATE} /> : null}

            {/* ── WORKFLOWS ── */}
            {view === "workflows" ? (
              <div className="space-y-4">
                <Card>
                  <Heatmap
 title="Where the change activity is"
 subtitle="Changes per workflow per day, last 21 days"
                    columns={buckets.map((b) => shortDate(b.date))}
                    rows={rollups.map((r) => ({
                      label: r.workflow.name,
                      values: dailyBuckets(
                        ESTATE.filter((c) => c.workflow.id === r.workflow.id),
                        21,
                      ).map((b) => b.total),
                    }))}
 valueLabel="Changes"
                    labelEvery={3}
                  />
                </Card>

                <Card padded={false}>
                  <div className="p-4 sm:p-5">
                    <CardHeader
 title="The estate"
 subtitle="One row per governed workflow, worst mean risk first"
                    />
                  </div>
                  <div className="table-scroll">
                    <table className="w-full min-w-[880px] text-[12px]">
                      <caption className="sr-only">
                        Governed workflows with regimes, evidence coverage and mean modelled
                        risk.
                      </caption>
                      <thead>
                        <tr className="border-y border-line bg-raised text-left">
                          <th scope="col" className="px-4 py-2.5 font-medium text-mist">
                            Workflow
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                            Regimes
                          </th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium text-mist">
                            Changes
                          </th>
                          <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                            Evidence
                          </th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium text-mist">
                            Open approvals
                          </th>
                          <th scope="col" className="px-4 py-2.5 text-right font-medium text-mist">
                            Mean risk
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rollups.map((r) => {
                          const band = bandFor(r.meanRisk);
                          return (
                            <tr
                              key={r.workflow.id}
 className="border-b border-line transition-colors last:border-0 hover:bg-raised"
                            >
                              <td className="px-4 py-3 align-top">
                                <p className="text-fog">{r.workflow.name}</p>
                                <p className="mt-0.5 text-[11px] text-mist">
                                  {r.workflow.unit} · {r.workflow.dependents} downstream ·{" "}
                                  {r.workflow.incidents90d} incidents / 90d
                                </p>
                              </td>
                              <td className="px-3 py-3 align-top text-mist">
                                {r.workflow.regimes.length === 0
                                  ? "—"
                                  : r.workflow.regimes.join(" · ")}
                              </td>
                              <td className="tnum px-3 py-3 text-right align-top text-fog">
                                {r.changes}
                              </td>
                              <td className="px-3 py-3 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="w-14 shrink-0">
                                    <Meter
                                      value={r.sealedPct}
                                      color={
                                        r.sealedPct >= 90 ? STATUS.good.hex : STATUS.serious.hex
                                      }
                                      height={6}
                                      label={`${r.workflow.name} evidence coverage: ${r.sealedPct} percent`}
                                    />
                                  </span>
                                  <span className="tnum text-mist">{r.sealedPct}%</span>
                                </div>
                              </td>
                              <td className="tnum px-3 py-3 text-right align-top">
                                <span className={r.openApprovals > 0 ? "text-warn" : "text-mist"}>
                                  {r.openApprovals}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right align-top">
                                <Badge
                                  role={SEVERITY_ROLE[band]!}
                                  title={r.topDriver ? `Top driver: ${r.topDriver}` : undefined}
                                >
                                  {pct(r.meanRisk)}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : null}

            {/* ── RISK ── */}
            {view === "risk" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
 label="Critical"
                    value={num(distribution.critical)}
 note="p ≥ 0.6"
                    emphasis={distribution.critical > 0}
                  />
                  <StatTile label="High" value={num(distribution.high)} note="p ≥ 0.35" />
                  <StatTile label="Elevated" value={num(distribution.elevated)} note="p ≥ 0.15" />
                  <StatTile
 label="Recoverable time"
                    value={String(workDays(summary.recoverableMinutes))}
 unit="days"
 note="sitting in automatable fixes"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Card>
                    <Donut
 title="Band distribution"
 subtitle="Across every change in the window"
                      centreValue={num(summary.total)}
 centreLabel="scored"
                      slices={SEVERITY_ORDER.map((band) => ({
                        label: SEVERITY_LABEL[band],
                        value: distribution[band],
                        color: severityToken(band).hex,
                      }))}
                    />
                  </Card>
                  <Card className="lg:col-span-2">
                    <BarList
 title="Estate-level drivers"
 subtitle="Feature contributions summed across every scored change"
 valueLabel="Share of total risk push"
 format="decimal1"
                      rows={drivers.map((d) => ({
                        label: d.label,
                        value: Math.round(d.share * 1000) / 10,
                        note: d.because,
                        meta: "%",
                      }))}
                    />
                  </Card>
                </div>

                <Card>
                  <CardHeader
 title="The model"
 subtitle="Published in full — a governance model that is itself a black box contradicts the product"
                  />
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="table-scroll lg:col-span-2">
                      <table className="w-full min-w-[460px] text-[12px]">
                        <caption className="sr-only">
                          Risk model features, weights, and what each one reads as.
                        </caption>
                        <thead>
                          <tr className="border-b border-line text-left">
                            <th scope="col" className="py-2 pr-3 font-medium text-mist">
                              Feature
                            </th>
                            <th scope="col" className="py-2 pr-3 text-right font-medium text-mist">
                              Weight
                            </th>
                            <th scope="col" className="py-2 font-medium text-mist">
                              Reads as
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {FEATURE_MODEL.map((f) => (
                            <tr key={f.key} className="border-b border-line last:border-0">
                              <td className="py-2 pr-3 text-fog">{f.label}</td>
                              <td className="tnum py-2 pr-3 text-right text-ink">
                                {f.weight.toFixed(1)}
                              </td>
                              <td className="py-2 text-mist">{f.because}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div className="border border-line bg-void p-3">
                        <p className="mb-2 text-[11px] tracking-[0.08em] text-mist uppercase">
                          The whole model
                        </p>
                        <code className="font-mono text-[12px] text-fog">
                          p = σ({INTERCEPT} + Σ wᵢ·xᵢ)
                        </code>
                      </div>
                      <p className="mt-3 text-[11px] leading-relaxed text-mist">
                        Weights are published priors set from the failure modes the
                        architecture is designed around. They are{" "}
                        <span className="text-fog">not fitted on customer data</span> — there is
                        none yet. In deployment they are re-fit per tenant.
                      </p>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {[...ESTATE]
                    .sort((a, b) => b.risk.probability - a.risk.probability)
                    .slice(0, 4)
                    .map((change) => (
                      <Card key={change.id}>
                        <div className="mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge role={SEVERITY_ROLE[change.risk.band]!}>
                              {SEVERITY_LABEL[change.risk.band]} · {pct(change.risk.probability, 1)}
                            </Badge>
                            <span className="text-[12px] text-mist">{change.workflow.name}</span>
                          </div>
                          <p className="mt-2 text-[13px] text-ink">{change.summary}</p>
                          <p className="mt-1 text-[11px] text-mist">
                            {change.kindLabel} · {change.modelId} · {change.actor} ·{" "}
                            {ago(change.at)}
                          </p>
                        </div>
                        <div className="border border-line bg-void p-3">
                          <p className="mb-2.5 text-[11px] tracking-[0.08em] text-mist uppercase">
                            Why this score — weight × value
                          </p>
                          <ContributionBars contributions={change.risk.contributions} />
                        </div>
                        {change.risk.resolutions[0] ? (
                          <div className="mt-3 border border-line p-2.5">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-[12px] text-fog">
                                {change.risk.resolutions[0].title}
                              </span>
                              <span className="text-[11px]">
                                {change.risk.resolutions[0].automatable ? (
                                  <span className="text-live">✓ automatable</span>
                                ) : (
                                  <span className="text-mist">needs a human</span>
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] text-mist">
                              Keyed to{" "}
                              <span className="text-fog">
                                {change.risk.contributions[0]?.label}
                              </span>
                              , which is what actually pushed this score.
                            </p>
                          </div>
                        ) : null}
                      </Card>
                    ))}
                </div>
              </div>
            ) : null}

            {/* ── CONNECTORS ── */}
            {view === "connectors" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile
 label="Connected"
                    value={String(CONNECTORS.filter((c) => c.status === "connected").length)}
                    note={`${CONNECTORS.filter((c) => c.status === "available").length} available · ${CONNECTORS.filter((c) => c.status === "planned").length} planned`}
                  />
                  <StatTile
 label="Writing back"
                    value={String(
                      CONNECTORS.filter((c) => c.status === "connected" && c.writes.length > 0)
                        .length,
                    )}
 note="connectors that put work back into the tool"
                    emphasis
                  />
                  <StatTile
 label="Events, last 7 days"
                    value={compact(CONNECTORS.reduce((s, c) => s + c.events7d, 0))}
                  />
                  <StatTile label="Categories" value={String(new Set(CONNECTORS.map((c) => c.category)).size)} />
                </div>

                <Card>
                  <BarList
 title="Change-shaped traffic"
 subtitle="Events over 7 days, excluding the two telemetry firehoses — plotting 4.2M beside 11 would flatten every other bar to nothing"
 valueLabel="Events / 7d"
 format="int"
                    rows={CONNECTORS.filter((c) => c.events7d > 0 && c.events7d < 100_000)
                      .sort((a, b) => b.events7d - a.events7d)
                      .map((c) => ({
                        label: c.name,
                        value: c.events7d,
                        note:
                          c.direction === "both"
                            ? "Reads and writes"
                            : c.direction === "read"
                              ? "Reads only"
                              : "Writes only",
                      }))}
                  />
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {CONNECTORS.map((connector) => (
                    <Card key={connector.id}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-semibold text-ink">
                              {connector.name}
                            </h3>
                            <Badge
                              role={
                                connector.status === "connected"
                                  ? "good"
                                  : connector.status === "available"
                                    ? "info"
                                    : "absent"
                              }
                            >
                              {connector.status === "connected"
                                ? "Connected"
                                : connector.status === "available"
                                  ? "Available"
                                  : "Planned"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-mist">{connector.auth}</p>
                        </div>
                        {connector.status === "connected" ? (
                          <p className="text-[11px] text-mist">
                            {compact(connector.events7d)} / 7d · {connector.lastSync}
                          </p>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1.5 text-[11px] tracking-[0.08em] text-mist uppercase">
                            Reads
                          </p>
                          {connector.reads.length === 0 ? (
                            <p className="text-[12px] text-mist">Nothing — this one only writes.</p>
                          ) : (
                            <ul className="space-y-1">
                              {connector.reads.map((item) => (
                                <li key={item} className="flex gap-1.5 text-[12px] text-fog">
                                  <span aria-hidden className="text-mist">
                                    ←
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="mb-1.5 text-[11px] tracking-[0.08em] text-verify uppercase">
                            Writes back
                          </p>
                          {connector.writes.length === 0 ? (
                            <p className="text-[12px] text-mist">Nothing — read-only by design.</p>
                          ) : (
                            <ul className="space-y-1">
                              {connector.writes.map((item) => (
                                <li key={item} className="flex gap-1.5 text-[12px] text-fog">
                                  <span aria-hidden className="text-verify">
                                    →
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ── COMPLIANCE ── */}
            {view === "compliance" ? (
              <div className="space-y-4">
                <Card>
                  <BarList
 title="Coverage by regime"
 subtitle="Share of in-scope changes that are sealed and not behind an overdue approval"
 valueLabel="Coverage"
 format="plain"
                    rows={posture.map((p) => ({
                      label: p.regime,
                      value: p.pct,
                      color:
                        p.pct >= 95
                          ? STATUS.good.hex
                          : p.pct >= 85
                            ? STATUS.info.hex
                            : p.pct >= 70
                              ? STATUS.serious.hex
                              : STATUS.critical.hex,
                      note: `${p.evidenced} of ${p.inScope} changes evidenced`,
                      meta: "%",
                    }))}
                  />
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {posture.map((regime) => (
                    <Card key={regime.regime}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[14px] font-semibold text-ink">{regime.regime}</h3>
                          <p className="mt-1 max-w-md text-[12px] text-mist">
                            {regime.requirement}
                          </p>
                        </div>
                        <Badge
                          role={
                            regime.pct >= 95
                              ? "good"
                              : regime.pct >= 85
                                ? "info"
                                : regime.pct >= 70
                                  ? "serious"
                                  : "critical"
                          }
                        >
                          {regime.pct}%
                        </Badge>
                      </div>
                      <Meter
                        value={regime.pct}
                        color={regime.pct >= 90 ? STATUS.good.hex : STATUS.serious.hex}
                        label={`${regime.regime} coverage: ${regime.pct} percent`}
                      />
                      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
                        <div>
                          <p className="text-[11px] text-mist">In scope</p>
                          <p className="tnum text-[16px] text-ink">{regime.inScope}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-mist">Evidenced</p>
                          <p className="tnum text-[16px] text-live">{regime.evidenced}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-mist">Gaps</p>
                          <p
                            className={`tnum text-[16px] ${regime.gaps > 0 ? "text-warn" : "text-mist"}`}
                          >
                            {regime.gaps}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader title="What these percentages are, exactly" />
                  <ul className="space-y-2 text-[12px] text-mist">
                    <li>
                      <span className="text-fog">In scope</span> — a change to a workflow this
                      regime governs, inside the window. Nothing is counted by hand.
                    </li>
                    <li>
                      <span className="text-fog">Evidenced</span> — that change carries a sealed,
                      offline-verifiable receipt <em>and</em> is not sitting behind an approval
                      past SLA. A sealed record stuck behind a missing sign-off is evidence of a
                      gap, not of compliance.
                    </li>
                    <li>
                      <span className="text-fog">What this is not</span> — a legal opinion or a
                      certification. It measures whether the record of what you did is complete
                      and provable. Whether what you did was lawful is a separate question, and
                      this console does not answer it.
                    </li>
                  </ul>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── the change feed, with its filters ────────────────────────────────── */

/**
 * One filter row above everything it scopes — the chart and the table
 * re-render against the same slice. Per-chart filters are how a dashboard
 * starts lying: two cards showing different subsets, with nothing on screen
 * to say so.
 */
function ChangeFeed({ changes }: { changes: readonly AIChange[] }) {
  const [kind, setKind] = useState<string>("all");
  const [band, setBand] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return changes.filter((c) => {
      if (kind !== "all" && c.kind !== kind) return false;
      if (band !== "all" && c.risk.band !== band) return false;
      if (
        q &&
        !(
          c.summary.toLowerCase().includes(q) ||
          c.workflow.name.toLowerCase().includes(q) ||
          c.modelId.toLowerCase().includes(q) ||
          c.actor.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [changes, kind, band, query]);

  const buckets = useMemo(() => dailyBuckets(filtered, 21), [filtered]);

  return (
    <div className="space-y-4">
      <div className="border border-line bg-panel p-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] tracking-[0.08em] text-mist uppercase">Type</span>
            <Button type="button" onClick={() => setKind("all")} active={kind === "all"}>
              Any
            </Button>
            {CHANGE_KINDS.map((k) => (
              <Button key={k} type="button" onClick={() => setKind(k)} active={kind === k}>
                {KIND_SHORT[k]}
                <span className="tnum ml-1 text-[11px] opacity-65">
                  {changes.filter((c) => c.kind === k).length}
                </span>
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] tracking-[0.08em] text-mist uppercase">Risk</span>
            <Button type="button" onClick={() => setBand("all")} active={band === "all"}>
              Any
            </Button>
            {SEVERITY_ORDER.map((b) => (
              <Button key={b} type="button" onClick={() => setBand(b)} active={band === b}>
                {SEVERITY_LABEL[b]}
                <span className="tnum ml-1 text-[11px] opacity-65">
                  {changes.filter((c) => c.risk.band === b).length}
                </span>
              </Button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
 placeholder="Search summary, workflow, model…"
 aria-label="Search changes"
 className="ml-auto w-56 border border-line bg-void px-2.5 py-1 text-[12px] text-ink outline-none placeholder:text-mist focus:border-verify"
          />
        </div>
        <p className="mt-2.5 border-t border-line pt-2.5 text-[12px] text-mist">
          Showing <span className="tnum text-ink">{filtered.length}</span> of{" "}
          <span className="tnum">{changes.length}</span> changes — every card below is scoped to
          this slice.
        </p>
      </div>

      <Card>
        <ColumnChart
 title="Volume in this slice"
 subtitle="Daily count by change type"
          categories={buckets.map((b) => shortDate(b.date))}
          series={CHANGE_KINDS.map((k, i) => ({
            label: KIND_SHORT[k],
            color: SERIES[i]!,
            values: buckets.map((b) => b.byKind[k]),
          }))}
          labelEvery={3}
          height={170}
        />
      </Card>

      <Card padded={false}>
        <div className="table-scroll">
          <table className="w-full min-w-[900px] text-[12px]">
            <caption className="sr-only">
              AI changes, newest first, with risk band, evidence state and approval state.
            </caption>
            <thead>
              <tr className="border-b border-line bg-raised text-left">
                <th scope="col" className="px-4 py-2.5 font-medium text-mist">
                  Change
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                  Workflow
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                  Model
                </th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium text-mist">
                  Risk
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                  Evidence
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium text-mist">
                  Approval
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium text-mist">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((c) => (
                <tr
                  key={c.id}
 className="border-b border-line transition-colors last:border-0 hover:bg-raised"
                >
                  <td className="max-w-[320px] px-4 py-3 align-top">
                    <p className="text-fog">{c.summary}</p>
                    <p className="mt-1 text-[11px] text-mist">
                      {KIND_SHORT[c.kind]} · {c.actor}
                      {c.env === "staging" ? " · staging" : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top text-mist">{c.workflow.name}</td>
                  <td className="px-3 py-3 align-top">
                    <span className="text-fog">{c.modelId}</span>
                    <span className="block text-[11px] text-mist">{c.provider}</span>
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <Badge
                      role={SEVERITY_ROLE[c.risk.band]!}
                      title={`Top driver: ${c.risk.contributions[0]?.label}`}
                    >
                      {pct(c.risk.probability)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge role={EVIDENCE_ROLE[c.evidence]}>{EVIDENCE_LABEL[c.evidence]}</Badge>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge role={APPROVAL_ROLE[c.approval]}>{APPROVAL_LABEL[c.approval]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right align-top whitespace-nowrap text-mist">
                    {ago(c.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 30 ? (
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-mist">
            Showing the 30 most recent of {filtered.length} matching changes.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
