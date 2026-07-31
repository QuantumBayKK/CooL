"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useState } from "react";

/**
 * TAM / SAM / SOM as nested circles — area scaled, not decorative.
 *
 * The radii are set so each ring's AREA is proportional to its value, which is
 * the only honest way to draw this: sizing by radius would make the SOM look
 * ~7× larger than it is, and an investor who has seen a hundred of these decks
 * will notice. Each ring carries a leader line to its own card stating what the
 * number is, why it is that number, how it was derived, and where it came from.
 */

type Ring = {
  id: string;
  short: string;
  value: string;
  title: string;
  why: string;
  how: string;
  source: string;
  /** Relative value used to scale the drawn area. */
  weight: number;
  color: string;
  fill: string;
};

const RINGS: Ring[] = [
  {
    id: "tam",
    short: "TAM",
    value: "$12–15B",
    title: "AI governance & operations software, by 2030",
    why: "Every enterprise running AI ends up needing to document, approve and prove its changes. Regulation is turning that from a preference into a requirement.",
    how: "Published market sizing for AI governance and AI-operations software, taken at the 2030 horizon.",
    source: "Grand View Research · Next Move Strategy Consulting",
    weight: 13.5,
    color: "#8b949e",
    fill: "rgba(139,148,158,0.10)",
  },
  {
    id: "sam",
    short: "SAM",
    value: "$2–4B",
    title: "Regulated and security-conscious enterprises running AI in production",
    why: "Only companies with AI already in production, inside a regulated or security-reviewed environment, feel the pain hard enough to buy this year rather than eventually.",
    how: "TAM narrowed to enterprises with live production AI in finance, health, legal, insurance and public sector — the segments where an auditor or a security review is already a gate.",
    source: "Segment filter applied to the TAM sources above",
    weight: 3,
    color: "#58a6ff",
    fill: "rgba(88,166,255,0.14)",
  },
  {
    id: "som",
    short: "SOM",
    value: "$100–300M",
    title: "Our realistic share as the system of record",
    why: "We win the slice that needs evidence which holds across providers and survives tampering — the part incumbents structurally cannot serve because they are tied to their own stack.",
    how: "Bottom-up from the beachhead: AI companies in fintech, health and legal that lose deals waiting on security review, entered through the free SDK and converted to platform licences.",
    source: "Founder bottom-up model · beachhead defined on the go-to-market slide",
    weight: 0.2,
    color: "#3fb950",
    fill: "rgba(63,185,80,0.16)",
  },
];

/* Geometry — area-proportional radii inside a 300px-wide field. */
const MAX_R = 132;
const maxWeight = RINGS[0]!.weight;
const radiusFor = (w: number) => Math.max(26, MAX_R * Math.sqrt(w / maxWeight));

export default function MarketCircles() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string>("som");

  const cx = 150;
  const cy = 150;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-center lg:gap-8">
      {/* ── the circles ───────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-[300px]">
        <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="TAM, SAM and SOM drawn as area-proportional nested circles">
          <title>Market sizing — area-proportional</title>

          {RINGS.map((ring, i) => {
            const r = radiusFor(ring.weight);
            const isActive = active === ring.id;
            return (
              <motion.circle
                key={ring.id}
                cx={cx}
                cy={cy}
                r={r}
                fill={ring.fill}
                stroke={ring.color}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={ring.id === "tam" ? "4 4" : undefined}
                initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                whileInView={{ scale: 1, opacity: isActive ? 1 : 0.65 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.85,
                  delay: reduced ? 0 : 0.12 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ transformOrigin: `${cx}px ${cy}px`, cursor: "pointer" }}
                onMouseEnter={() => setActive(ring.id)}
                onClick={() => setActive(ring.id)}
              />
            );
          })}

          {/* leader lines + ring labels, drawn outward at fixed angles */}
          {RINGS.map((ring, i) => {
            const r = radiusFor(ring.weight);
            // TAM up-left, SAM right, SOM down — so the lines never cross.
            const angle = [-125, -18, 78][i]! * (Math.PI / 180);
            const x1 = cx + Math.cos(angle) * r;
            const y1 = cy + Math.sin(angle) * r;
            const x2 = cx + Math.cos(angle) * (r + 24);
            const y2 = cy + Math.sin(angle) * (r + 24);
            const anchor = Math.cos(angle) < -0.2 ? "end" : Math.cos(angle) > 0.2 ? "start" : "middle";
            const isActive = active === ring.id;

            return (
              <motion.g
                key={`${ring.id}-label`}
                initial={reduced ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: reduced ? 0 : 0.4 + 0.12 * i }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActive(ring.id)}
                onClick={() => setActive(ring.id)}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={ring.color}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={isActive ? 1 : 0.6}
                />
                <circle cx={x1} cy={y1} r={2.4} fill={ring.color} />
                <text
                  x={x2 + (anchor === "end" ? -5 : anchor === "start" ? 5 : 0)}
                  y={y2 - 3}
                  textAnchor={anchor}
                  fill={ring.color}
                  className="font-mono"
                  style={{ fontSize: 11, letterSpacing: "0.14em" }}
                  opacity={isActive ? 1 : 0.75}
                >
                  {ring.short}
                </text>
                <text
                  x={x2 + (anchor === "end" ? -5 : anchor === "start" ? 5 : 0)}
                  y={y2 + 11}
                  textAnchor={anchor}
                  fill="#f0f6fc"
                  className="font-mono"
                  style={{ fontSize: 12.5, fontWeight: 600 }}
                  opacity={isActive ? 1 : 0.75}
                >
                  {ring.value}
                </text>
              </motion.g>
            );
          })}
        </svg>

        <p className="mt-1 text-center font-mono text-[10.5px] leading-relaxed text-mist">
          Circles are area-proportional · tap a ring for its working
        </p>
      </div>

      {/* ── the working ───────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        {RINGS.map((ring) => {
          const isActive = active === ring.id;
          return (
            <button
              key={ring.id}
              type="button"
              onMouseEnter={() => setActive(ring.id)}
              onClick={() => setActive(ring.id)}
              className={clsx(
                "frost block w-full rounded-xl border px-4 py-3.5 text-left transition-all",
                isActive ? "border-verify/45" : "border-line hover:border-line",
              )}
              style={isActive ? { borderColor: `${ring.color}66` } : undefined}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="font-mono text-[11px] tracking-[0.16em]"
                  style={{ color: ring.color }}
                >
                  {ring.short}
                </span>
                <span className="font-mono text-[16px] font-semibold text-ink">
                  {ring.value}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] leading-snug font-medium text-fog">
                {ring.title}
              </p>

              <motion.div
                initial={false}
                animate={{
                  height: isActive ? "auto" : 0,
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 space-y-2 border-t border-line pt-2.5">
                  <p className="text-[13px] leading-relaxed text-fog">
                    <span className="font-mono text-[10.5px] tracking-[0.14em] text-mist uppercase">
                      Why
                    </span>
                    <br />
                    {ring.why}
                  </p>
                  <p className="text-[13px] leading-relaxed text-fog">
                    <span className="font-mono text-[10.5px] tracking-[0.14em] text-mist uppercase">
                      How
                    </span>
                    <br />
                    {ring.how}
                  </p>
                  <p className="font-mono text-[11px] leading-relaxed text-mist">
                    Source · {ring.source}
                  </p>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
