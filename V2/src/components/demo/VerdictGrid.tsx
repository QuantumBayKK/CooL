"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { DomainStatus, Verdict } from "@/lib/cool/types";

/**
 * The six trust domains, rendered exactly as the verifier reports them.
 *
 * The honesty of this grid is the point. `attestation` and `anchor` are shown
 * as MOCK and ABSENT because that is what the code returns today — a green wall
 * of six ticks would be a lie, and an investor who checks would find it. The
 * two grey cells are the most credible things on the page.
 */

const DOMAIN_COPY: Record<
  keyof Verdict["checks"],
  { title: string; plain: string }
> = {
  binding: {
    title: "Binding",
    plain: "The record still hashes to the fingerprint it was sealed with.",
  },
  signature: {
    title: "Signature",
    plain: "Both seals verify — post-quantum and classical.",
  },
  inclusion: {
    title: "Log inclusion",
    plain: "The entry is provably in the append-only log.",
  },
  witnesses: {
    title: "Independent witnesses",
    plain: "Third parties who countersigned the log.",
  },
  attestation: {
    title: "Hardware attestation",
    plain: "Proof of which model actually ran.",
  },
  anchor: {
    title: "Public anchor",
    plain: "The log root published beyond CooL's reach.",
  },
};

const STATUS_STYLE: Record<DomainStatus, { chip: string; ring: string; glyph: string; word: string }> =
  {
    pass: {
      chip: "text-live border-live/45 bg-live/10",
      ring: "border-live/35",
      glyph: "✓",
      word: "PASS",
    },
    fail: {
      chip: "text-fail border-fail/50 bg-fail/10",
      ring: "border-fail/45",
      glyph: "✕",
      word: "FAIL",
    },
    mock: {
      chip: "text-mock border-mock/40 bg-mock/[0.07]",
      ring: "border-line",
      glyph: "◐",
      word: "MOCK",
    },
    absent: {
      chip: "text-mock border-mock/40 bg-mock/[0.07]",
      ring: "border-line",
      glyph: "—",
      word: "ABSENT",
    },
  };

const ORDER: (keyof Verdict["checks"])[] = [
  "binding",
  "signature",
  "inclusion",
  "witnesses",
  "attestation",
  "anchor",
];

export default function VerdictGrid({ verdict }: { verdict: Verdict }) {
  return (
    <div>
      {/* headline verdict */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={clsx(
          "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3.5",
          verdict.ok
            ? "border-live/40 bg-live/[0.08]"
            : "border-fail/45 bg-fail/[0.08]",
        )}
      >
        <span
          className={clsx(
            "flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-[15px]",
            verdict.ok
              ? "border-live/50 text-live"
              : "border-fail/55 text-fail",
          )}
        >
          {verdict.ok ? "✓" : "✕"}
        </span>
        <div className="min-w-0">
          <p
            className={clsx(
              "font-mono text-[13px] font-semibold tracking-[0.1em] uppercase",
              verdict.ok ? "text-live" : "text-fail",
            )}
          >
            {verdict.ok ? "Receipt verified offline" : "Receipt rejected"}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-fog">
            {verdict.ok
              ? "Checked in your browser against the keys inside the receipt. No call to CooL."
              : verdict.reasons[0] ?? "One or more domains failed."}
          </p>
        </div>
      </motion.div>

      {/* per-domain detail */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ORDER.map((key, i) => {
          const check = verdict.checks[key];
          const style = STATUS_STYLE[check.status];
          const copy = DOMAIN_COPY[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
              className={clsx(
                "frost rounded-xl border px-3.5 py-3",
                style.ring,
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[12.5px] font-semibold text-ink">
                  {copy.title}
                </p>
                <span
                  className={clsx(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em]",
                    style.chip,
                  )}
                >
                  {style.glyph} {style.word}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-snug text-mist">
                {copy.plain}
              </p>
              <p className="mt-1.5 font-mono text-[11px] leading-snug break-words text-fog/70">
                {check.detail}
              </p>
            </motion.div>
          );
        })}
      </div>

      {verdict.reasons.length > 0 ? (
        <div className="mt-3 rounded-xl border border-fail/35 bg-fail/[0.06] px-3.5 py-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-fail uppercase">
            Why it failed
          </p>
          <ul className="mt-1.5 space-y-1">
            {verdict.reasons.map((r) => (
              <li key={r} className="font-mono text-[12px] leading-snug text-fog">
                · {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
