"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, X, Clock, Zap } from "lucide-react";
import {
  HISTORY,
  HISTORY_KIND_STYLE,
  medianTimeToCause,
  type HistoryKind,
} from "@/lib/demo/integrations";
import { buildEstate } from "@/lib/dashboard/estate";
import { BAND_STYLE, FEATURE_MODEL } from "@/lib/dashboard/risk";
import { Meter } from "@/components/dashboard/parts";

/**
 * Prediction and memory — the two halves of "it won't happen again".
 *
 * Prediction is the risk model reading a change before it bites: which of
 * today's changes is most likely to cause an incident, which feature drove that
 * score, and the fix that addresses that specific driver.
 *
 * Memory is the indexed history. Its value is not that errors are stored — it
 * is that every error carries the change it traces back to, so the question
 * "why did this break" is a lookup. The median time-to-cause across this index
 * is minutes, and the honest comparison is that the same question without an
 * index is a war room.
 */

const KINDS: { id: "all" | HistoryKind; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "error", label: "Errors" },
  { id: "incident", label: "Incidents" },
  { id: "audit", label: "Audits" },
  { id: "change", label: "Governance" },
];

export default function IntelligenceView() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | HistoryKind>("all");

  const changes = useMemo(() => buildEstate(), []);
  const predicted = useMemo(
    () =>
      [...changes]
        .sort((a, b) => b.risk.probability - a.risk.probability)
        .slice(0, 4),
    [changes],
  );

  const history = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HISTORY.filter((h) => {
      if (kind !== "all" && h.kind !== kind) return false;
      if (!q) return true;
      return (
        h.title.toLowerCase().includes(q) ||
        h.summary.toLowerCase().includes(q) ||
        h.workflow.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q) ||
        (h.rootCause ?? "").toLowerCase().includes(q) ||
        h.tags.some((t) => t.includes(q))
      );
    });
  }, [query, kind]);

  const median = medianTimeToCause();
  const resolved = HISTORY.filter((h) => h.outcome === "resolved").length;

  return (
    <div className="space-y-5">
      {/* ── prediction ────────────────────────────────────────────────── */}
      <section>
        <h3 className="font-mono text-[12px] tracking-[0.16em] text-verify uppercase">
          Predicted before it bites
        </h3>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-fog">
          Every captured change is scored the moment it lands. The score is a
          logistic model over eight weighted signals, and it is fully
          decomposable — so the fix is always aimed at the thing that actually
          caused the risk, not a generic warning.
        </p>

        <div className="mt-3 space-y-2.5">
          {predicted.map((c) => {
            const s = BAND_STYLE[c.risk.band];
            const driver = c.risk.contributions[0];
            const fix = c.risk.resolutions[0];
            return (
              <div
                key={c.id}
                className={clsx("frost rounded-2xl border p-4", s.border)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[13.5px] leading-snug text-ink">
                      {c.summary}
                    </p>
                    <p className="mt-1 text-[12.5px] text-mist">
                      {c.workflow.name} · {c.modelId}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={clsx("display text-[1.9rem] leading-none", s.text)}>
                      {Math.round(c.risk.probability * 100)}%
                    </p>
                    <p className="font-mono text-[9.5px] text-mist">incident risk</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.12em] text-mist uppercase">
                      Top driver
                    </p>
                    {driver ? (
                      <>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate font-mono text-[11.5px] text-fog">
                            {driver.label}
                          </span>
                          <span className="shrink-0 font-mono text-[10.5px] text-mist">
                            {Math.round(driver.share * 100)}% of the score
                          </span>
                        </div>
                        <Meter
                          value={driver.share * 100}
                          tone={c.risk.band === "critical" ? "fail" : "warn"}
                          className="mt-1"
                        />
                        <p className="mt-1.5 text-[12px] leading-snug text-mist">
                          Because {driver.because}.
                        </p>
                      </>
                    ) : null}
                  </div>

                  <div>
                    <p className="font-mono text-[10px] tracking-[0.12em] text-mist uppercase">
                      The fix it points to
                    </p>
                    {fix ? (
                      <div className="mt-1.5 rounded-lg border border-line bg-panel/40 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 font-mono text-[12px] text-ink">
                            {fix.title}
                          </p>
                          <span
                            className={clsx(
                              "shrink-0 rounded border px-1.5 py-px font-mono text-[9px] tracking-[0.1em]",
                              fix.automatable
                                ? "border-live/45 bg-live/10 text-live"
                                : "border-mock/40 text-mock",
                            )}
                          >
                            {fix.automatable ? "AUTO" : "HUMAN"}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-snug text-mist">
                          {fix.detail}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[12.5px] text-mist">
                        No material driver — nothing to action.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <details className="frost mt-3 rounded-xl border border-line px-4 py-3">
          <summary className="cursor-pointer font-mono text-[11.5px] text-mist hover:text-ink">
            The eight signals and their weights
          </summary>
          <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
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
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-mist">
            Priors set from the failure modes the system is built around — not
            fitted on customer data, because there isn&apos;t any yet. In
            deployment they are re-fit per tenant against that tenant&apos;s own
            incident history.
          </p>
        </details>
      </section>

      {/* ── memory ────────────────────────────────────────────────────── */}
      <section>
        <h3 className="font-mono text-[12px] tracking-[0.16em] text-verify uppercase">
          Indexed history
        </h3>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-fog">
          Every error, incident and audit, each carrying the change it traces
          back to. That link is the whole point: it turns &ldquo;why did this
          break&rdquo; from an investigation into a query.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { big: `${median} min`, small: "median time from symptom to root cause", tone: "text-live" },
            { big: String(HISTORY.length), small: "entries indexed and searchable", tone: "text-ink" },
            { big: String(resolved), small: "traced to a specific change and closed", tone: "text-verify" },
          ].map((s) => (
            <div key={s.small} className="frost rounded-xl border border-line px-4 py-3.5">
              <p className={clsx("display text-[clamp(1.5rem,4.6vw,2rem)] leading-none", s.tone)}>
                {s.big}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-fog">{s.small}</p>
            </div>
          ))}
        </div>

        <div className="frost mt-3 flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2">
          <Search className="size-3.5 shrink-0 text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search errors, audits, root causes, workflows, tags…"
            className="w-full bg-transparent font-mono text-[12.5px] text-ink outline-none placeholder:text-mist"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 text-mist hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={clsx(
                "rounded-full border px-3 py-1.5 font-mono text-[11.5px] transition-colors",
                kind === k.id
                  ? "border-verify/55 bg-verify/15 text-ink"
                  : "border-line text-mist hover:border-verify/40 hover:text-ink",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {history.map((h) => {
            const style = HISTORY_KIND_STYLE[h.kind];
            return (
              <article
                key={h.id}
                className="frost rounded-xl border border-line px-4 py-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={clsx(
                      "rounded-full border px-1.5 py-px font-mono text-[9px] tracking-[0.12em]",
                      style.border,
                      style.bg,
                      style.text,
                    )}
                  >
                    {style.label.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10.5px] text-mist">{h.id}</span>
                  <span className="font-mono text-[10.5px] text-mist">{h.at}</span>
                  {h.timeToCauseMinutes !== undefined ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-live">
                      <Clock className="size-2.5" />
                      {h.timeToCauseMinutes} min to cause
                    </span>
                  ) : null}
                </div>

                <p className="mt-1.5 text-[14px] leading-snug font-semibold text-ink">
                  {h.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-fog">{h.summary}</p>

                {h.rootCause ? (
                  <p className="mt-2 flex items-start gap-1.5 border-l-2 border-live/45 pl-2.5 text-[12.5px] leading-snug text-mist">
                    <Zap className="mt-0.5 size-3 shrink-0 text-live" />
                    <span className="min-w-0">
                      Traced to <span className="text-fog">{h.rootCause}</span>
                    </span>
                  </p>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10.5px] text-mist">{h.workflow}</span>
                  {h.regimes?.map((r) => (
                    <span
                      key={r}
                      className="rounded border border-verify/30 px-1.5 py-px font-mono text-[9.5px] text-verify"
                    >
                      {r}
                    </span>
                  ))}
                  {h.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-line px-1.5 py-px font-mono text-[9.5px] text-mist"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
          {history.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-mist">
              Nothing matches that search.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
