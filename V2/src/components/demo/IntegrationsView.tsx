"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from "lucide-react";
import { CONNECTORS, type Connector, type ConnectorStatus } from "@/lib/demo/integrations";

/**
 * The connector map.
 *
 * The claim this has to support is "CooL fits the systems you already run", and
 * the honest way to support it is to name exactly what CooL reads and what it
 * writes back into each one. The writes column is where the product's value
 * actually sits: every line in it is a thing a person used to type.
 *
 * Status is shown truthfully — CONNECTED, AVAILABLE and PLANNED are different
 * things, and a map that painted all twelve green would be worthless.
 */

const STATUS_STYLE: Record<
  ConnectorStatus,
  { label: string; text: string; border: string; bg: string }
> = {
  connected: {
    label: "CONNECTED",
    text: "text-live",
    border: "border-live/45",
    bg: "bg-live/10",
  },
  available: {
    label: "AVAILABLE",
    text: "text-verify",
    border: "border-verify/45",
    bg: "bg-verify/10",
  },
  planned: {
    label: "PLANNED",
    text: "text-mock",
    border: "border-mock/40",
    bg: "bg-mock/[0.08]",
  },
};

const DIRECTION_ICON = {
  read: ArrowDownLeft,
  write: ArrowUpRight,
  both: ArrowLeftRight,
} as const;

const DIRECTION_LABEL = {
  read: "reads from",
  write: "writes to",
  both: "two-way",
} as const;

function formatCount(n: number): string {
  if (n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function ConnectorCard({ c }: { c: Connector }) {
  const [open, setOpen] = useState(false);
  const style = STATUS_STYLE[c.status];
  const Icon = DIRECTION_ICON[c.direction];

  return (
    <div
      className={clsx(
        "frost rounded-2xl border transition-colors",
        c.status === "connected" ? "border-line" : "border-line/60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14.5px] font-semibold text-ink">{c.name}</p>
              <span
                className={clsx(
                  "rounded-full border px-1.5 py-px font-mono text-[9px] tracking-[0.12em]",
                  style.border,
                  style.bg,
                  style.text,
                )}
              >
                {style.label}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-mist">
              <Icon className="size-3" />
              {DIRECTION_LABEL[c.direction]} · {c.category}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-[13px] text-ink">{formatCount(c.events7d)}</p>
            <p className="font-mono text-[9.5px] text-mist">events / 7d</p>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-3.5">
              <p className="font-mono text-[10px] tracking-[0.14em] text-mist uppercase">
                Auth
              </p>
              <p className="mt-1 font-mono text-[11.5px] text-fog">{c.auth}</p>

              {c.reads.length ? (
                <>
                  <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-mist uppercase">
                    CooL reads
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {c.reads.map((x) => (
                      <li key={x} className="text-[12.5px] leading-snug text-fog">
                        · {x}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {c.writes.length ? (
                <>
                  <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-live uppercase">
                    CooL writes back — the work nobody does now
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {c.writes.map((x) => (
                      <li
                        key={x}
                        className="flex items-start gap-1.5 text-[12.5px] leading-snug text-fog"
                      >
                        <Check className="mt-0.5 size-3 shrink-0 text-live" strokeWidth={3} />
                        <span className="min-w-0">{x}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <p className="mt-3 font-mono text-[10.5px] text-mist">
                Last sync · {c.lastSync}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const CATEGORIES = [
  "All",
  "Atlassian",
  "Source control",
  "Messaging",
  "ITSM & GRC",
  "AI gateway",
  "Telemetry",
  "Identity",
] as const;

export default function IntegrationsView() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const shown = useMemo(
    () =>
      category === "All"
        ? CONNECTORS
        : CONNECTORS.filter((c) => c.category === category),
    [category],
  );

  const connected = CONNECTORS.filter((c) => c.status === "connected").length;
  const writes = CONNECTORS.reduce((s, c) => s + c.writes.length, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { big: String(connected), small: "connectors live in this estate", tone: "text-live" },
          { big: String(writes), small: "kinds of record written for you", tone: "text-verify" },
          { big: "0", small: "of them need a person", tone: "text-ink" },
        ].map((s) => (
          <div key={s.small} className="frost rounded-xl border border-line px-4 py-3.5">
            <p className={clsx("display text-[clamp(1.6rem,5vw,2.1rem)] leading-none", s.tone)}>
              {s.big}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-fog">{s.small}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={clsx(
              "rounded-full border px-3 py-1.5 font-mono text-[11.5px] transition-colors",
              category === c
                ? "border-verify/55 bg-verify/15 text-ink"
                : "border-line text-mist hover:border-verify/40 hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-[13px] leading-relaxed text-mist">
        Tap any connector to see the credentials it uses, what CooL takes from
        it, and — the part that matters — exactly what CooL writes back.
      </p>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {shown.map((c) => (
          <ConnectorCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
