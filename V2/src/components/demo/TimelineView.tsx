"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Zap, User } from "lucide-react";
import {
  buildTimeline,
  clockOf,
  kindMeta,
  since,
  type EventKind,
  type Severity,
  type System,
  type TimelineEvent,
} from "@/lib/demo/timeline";

/**
 * The timeline: one AI change, followed across every system it touches.
 *
 * The argument this view makes is not "we log things". It is that the commit,
 * the pull request, the CI run, the Jira issue, the Confluence page, the Slack
 * message, the sealed evidence and the audit entry are **one chain** — and that
 * a human only appears at the first link and at the approvals. Every other node
 * is marked AUTO, and carries the minutes it would otherwise have cost.
 *
 * Expanding a node shows the payload the integration actually wrote. That is
 * the "inner workings" the reader came for: not a description of the Jira
 * connector, the fields it set.
 */

const SYSTEM_STYLE: Record<System, { text: string; border: string; bg: string }> = {
  GitHub: { text: "text-fog", border: "border-line", bg: "bg-panel/50" },
  Jira: { text: "text-verify", border: "border-verify/35", bg: "bg-verify/[0.07]" },
  Confluence: { text: "text-verify", border: "border-verify/35", bg: "bg-verify/[0.07]" },
  Slack: { text: "text-[#a371f7]", border: "border-[#a371f7]/35", bg: "bg-[#a371f7]/[0.07]" },
  ServiceNow: { text: "text-[#d29922]", border: "border-[#d29922]/35", bg: "bg-[#d29922]/[0.07]" },
  PagerDuty: { text: "text-fail", border: "border-fail/40", bg: "bg-fail/[0.08]" },
  CooL: { text: "text-live", border: "border-live/40", bg: "bg-live/[0.08]" },
};

const SEVERITY_DOT: Record<Severity, string> = {
  info: "bg-mist",
  ok: "bg-live",
  warn: "bg-[#d29922]",
  error: "bg-fail",
};

/** Pretty-print a payload value without collapsing structure to [object]. */
function renderValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v, null, 2);
}

function EventRow({
  event,
  isLast,
  open,
  onToggle,
}: {
  event: TimelineEvent;
  isLast: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = kindMeta(event.kind);
  const style = SYSTEM_STYLE[event.system];

  return (
    <li className="relative">
      {/* the spine */}
      {!isLast ? (
        <span
          aria-hidden
          className="absolute top-8 left-[15px] h-[calc(100%-18px)] w-px bg-line"
        />
      ) : null}

      <div className="flex gap-3">
        {/* node */}
        <div className="relative z-10 pt-1.5">
          <span
            className={clsx(
              "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[12px]",
              style.border,
              style.bg,
              style.text,
            )}
          >
            {meta.glyph}
          </span>
        </div>

        <div className="min-w-0 flex-1 pb-4">
          <button
            type="button"
            onClick={onToggle}
            className="group w-full text-left"
            aria-expanded={open}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={clsx("font-mono text-[10px] tracking-[0.12em]", style.text)}>
                {event.system.toUpperCase()}
              </span>
              <span className="font-mono text-[10px] text-mist">
                {clockOf(event.at)}
              </span>
              <span
                className={clsx("size-1.5 rounded-full", SEVERITY_DOT[event.severity])}
                aria-hidden
              />
              {event.automated ? (
                <span className="inline-flex items-center gap-1 rounded border border-live/40 bg-live/10 px-1.5 py-px font-mono text-[9px] tracking-[0.1em] text-live">
                  <Zap className="size-2.5" /> AUTO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded border border-mock/40 px-1.5 py-px font-mono text-[9px] tracking-[0.1em] text-mock">
                  <User className="size-2.5" /> HUMAN
                </span>
              )}
              {event.automated && event.manualMinutes > 0 ? (
                <span className="font-mono text-[10px] text-live/80">
                  ~{event.manualMinutes} min saved
                </span>
              ) : null}
            </div>

            <p className="mt-1 flex items-start gap-1.5 text-[14px] leading-snug font-semibold text-ink">
              <ChevronRight
                className={clsx(
                  "mt-0.5 size-3.5 shrink-0 text-mist transition-transform",
                  open && "rotate-90",
                )}
              />
              <span className="min-w-0">{event.title}</span>
            </p>
            <p className="mt-1 pl-5 text-[13px] leading-relaxed text-fog">
              {event.detail}
            </p>

            {event.refs.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-5">
                {event.refs.map((ref) => (
                  <span
                    key={ref.label}
                    className="rounded border border-line bg-void/50 px-1.5 py-0.5 font-mono text-[10.5px] text-mist"
                  >
                    {ref.label}
                  </span>
                ))}
              </div>
            ) : null}
          </button>

          {/* the inner workings */}
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 ml-5 rounded-xl border border-line bg-void/60 p-3">
                  <p className="font-mono text-[10px] tracking-[0.14em] text-verify uppercase">
                    What {event.system} actually {event.kind === "incident" ? "saw" : "wrote"}
                  </p>
                  <dl className="mt-2 space-y-1.5">
                    {Object.entries(event.payload).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col gap-0.5 sm:flex-row sm:gap-3"
                      >
                        <dt className="w-full shrink-0 font-mono text-[10.5px] text-mist sm:w-44">
                          {k}
                        </dt>
                        <dd className="min-w-0 flex-1">
                          <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-fog">
                            {renderValue(v)}
                          </pre>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </li>
  );
}

const FILTERS: { id: "all" | EventKind; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "commit", label: "Code" },
  { id: "policy", label: "Policy" },
  { id: "ticket", label: "Atlassian" },
  { id: "seal", label: "Evidence" },
  { id: "incident", label: "Incidents" },
  { id: "audit", label: "Audit" },
];

/** Which kinds each filter chip covers. */
const FILTER_KINDS: Record<string, EventKind[]> = {
  commit: ["commit", "pr", "ci"],
  policy: ["policy", "approval", "capture"],
  ticket: ["ticket", "doc", "notify"],
  seal: ["seal"],
  incident: ["incident", "fix"],
  audit: ["audit"],
};

export default function TimelineView() {
  const chains = useMemo(() => buildTimeline(), []);
  const [chainId, setChainId] = useState(chains[0]!.id);
  const [filter, setFilter] = useState<"all" | EventKind>("all");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const chain = chains.find((c) => c.id === chainId)!;

  const events = useMemo(() => {
    if (filter === "all") return chain.events;
    const kinds = FILTER_KINDS[filter] ?? [filter];
    return chain.events.filter((e) => kinds.includes(e.kind));
  }, [chain, filter]);

  const humanSteps = chain.events.filter((e) => !e.automated).length;

  return (
    <div className="space-y-4">
      {/* which change */}
      <div className="frost rounded-2xl border border-line p-4 sm:p-5">
        <p className="font-mono text-[11px] tracking-[0.16em] text-verify uppercase">
          Pick a change to trace
        </p>
        <div className="mt-2.5 grid gap-2 lg:grid-cols-3">
          {chains.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setChainId(c.id);
                setOpen(new Set());
              }}
              className={clsx(
                "rounded-xl border px-3.5 py-3 text-left transition-colors",
                c.id === chainId
                  ? "border-verify/55 bg-verify/[0.09]"
                  : "border-line hover:border-verify/35",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-mist">
                  {since(c.at)}
                </span>
                {c.hadIncident ? (
                  <span className="rounded border border-fail/45 bg-fail/10 px-1.5 py-px font-mono text-[9px] tracking-[0.1em] text-fail">
                    INCIDENT
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[13.5px] leading-snug font-semibold text-ink">
                {c.title}
              </p>
              <p className="mt-1 font-mono text-[10.5px] text-mist">
                {c.workflow}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* the count that matters */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            big: String(chain.events.length),
            small: "systems touched, end to end",
            tone: "text-ink",
          },
          {
            big: String(humanSteps),
            small: "steps that needed a person",
            tone: "text-verify",
          },
          {
            big: `${Math.round(chain.minutesSaved / 6) / 10}h`,
            small: "of manual work that didn't happen",
            tone: "text-live",
          },
        ].map((s) => (
          <div key={s.small} className="frost rounded-xl border border-line px-4 py-3.5">
            <p className={clsx("display text-[clamp(1.6rem,5vw,2.1rem)] leading-none", s.tone)}>
              {s.big}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-fog">{s.small}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={clsx(
              "rounded-full border px-3 py-1.5 font-mono text-[11.5px] transition-colors",
              filter === f.id
                ? "border-verify/55 bg-verify/15 text-ink"
                : "border-line text-mist hover:border-verify/40 hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setOpen((prev) =>
              prev.size === events.length
                ? new Set()
                : new Set(events.map((e) => e.id)),
            )
          }
          className="ml-auto rounded-full border border-line px-3 py-1.5 font-mono text-[11.5px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
        >
          {open.size === events.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* the chain */}
      <div className="frost rounded-2xl border border-line p-4 sm:p-5">
        <ul>
          {events.map((e, i) => (
            <EventRow
              key={e.id}
              event={e}
              isLast={i === events.length - 1}
              open={open.has(e.id)}
              onToggle={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(e.id)) next.delete(e.id);
                  else next.add(e.id);
                  return next;
                })
              }
            />
          ))}
        </ul>
        {events.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-mist">
            Nothing of that kind in this chain.
          </p>
        ) : null}
      </div>
    </div>
  );
}
