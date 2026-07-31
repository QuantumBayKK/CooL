"use client";

import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useState } from "react";

/**
 * TAM / SAM / SOM as a heads-up display.
 *
 * The rings are still area-proportional — radius scales with √value — because
 * that is the only honest way to draw nested market sizes. Sizing by radius
 * would render the SOM roughly seven times larger than it is, and a reader who
 * has seen a hundred of these decks notices.
 *
 * The HUD treatment is the reticles, the sweep and the tick marks: they read as
 * an instrument rather than a chart, which suits a number that is an estimate.
 * Everything that moves is transform or opacity only, and all of it stops under
 * `prefers-reduced-motion`.
 */

type Ring = {
  id: string;
  short: string;
  value: string;
  title: string;
  why: string;
  source: string;
  weight: number;
  color: string;
};

const RINGS: Ring[] = [
  {
    id: "tam",
    short: "TAM",
    value: "$12–15B",
    title: "AI governance & operations software, by 2030",
    why: "Every enterprise running AI ends up needing to document, approve and prove its changes.",
    source: "Grand View Research · Next Move Strategy",
    weight: 13.5,
    color: "#8b949e",
  },
  {
    id: "sam",
    short: "SAM",
    value: "$2–4B",
    title: "Regulated enterprises running AI in production",
    why: "Finance, health, legal and public sector — where an auditor or a security review is already a gate.",
    source: "Segment filter applied to the TAM sources",
    weight: 3,
    color: "#58a6ff",
  },
  {
    id: "som",
    short: "SOM",
    value: "$100–300M",
    title: "Our share as the system of record",
    why: "The slice that needs evidence holding across providers — which incumbents structurally cannot serve.",
    source: "Founder bottom-up model",
    weight: 0.2,
    color: "#3fb950",
  },
];

const CX = 150;
const CY = 150;
const MAX_R = 118;
const maxWeight = RINGS[0]!.weight;
const radiusFor = (w: number) => Math.max(24, MAX_R * Math.sqrt(w / maxWeight));

/** Tick marks around the outer bezel — the HUD's instrument face. */
function Bezel({ animate }: { animate: boolean }) {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <g opacity={0.5}>
      {ticks.map((i) => {
        const major = i % 5 === 0;
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const r1 = MAX_R + 14;
        const r2 = r1 + (major ? 7 : 3.5);
        return (
          <line
            key={i}
            x1={CX + Math.cos(a) * r1}
            y1={CY + Math.sin(a) * r1}
            x2={CX + Math.cos(a) * r2}
            y2={CY + Math.sin(a) * r2}
            stroke="#58a6ff"
            strokeWidth={major ? 1.2 : 0.6}
            opacity={major ? 0.75 : 0.35}
          />
        );
      })}
      {/* the sweep — one slow rotation, the thing that makes it read as live */}
      {animate ? (
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          style={{ originX: `${CX}px`, originY: `${CY}px` }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - (MAX_R + 12)}
            stroke="url(#sweep)"
            strokeWidth={1.4}
          />
        </motion.g>
      ) : null}
    </g>
  );
}

export default function MarketCircles() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState("som");

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center lg:gap-8">
      {/* ── the instrument ─────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-[320px]">
        <svg
          viewBox="0 0 300 300"
          className="w-full overflow-visible"
          role="img"
          aria-label="TAM, SAM and SOM drawn as area-proportional nested rings"
        >
          <defs>
            <linearGradient id="sweep" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#58a6ff" stopOpacity="0" />
              <stop offset="100%" stopColor="#58a6ff" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="core">
              <stop offset="0%" stopColor="#3fb950" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3fb950" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* crosshairs */}
          <g stroke="#58a6ff" strokeWidth={0.5} opacity={0.22}>
            <line x1={CX} y1={4} x2={CX} y2={296} />
            <line x1={4} y1={CY} x2={296} y2={CY} />
          </g>

          <Bezel animate={!reduced} />

          {/* the rings, drawn largest first */}
          {RINGS.map((ring, i) => {
            const r = radiusFor(ring.weight);
            const on = active === ring.id;
            return (
              <motion.circle
                key={ring.id}
                cx={CX}
                cy={CY}
                r={r}
                fill={ring.id === "som" ? "url(#core)" : "transparent"}
                stroke={ring.color}
                strokeWidth={on ? 1.8 : 1}
                strokeDasharray={ring.id === "tam" ? "3 5" : ring.id === "sam" ? "6 4" : undefined}
                initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: on ? 1 : 0.55 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.9,
                  delay: reduced ? 0 : 0.15 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ originX: `${CX}px`, originY: `${CY}px`, cursor: "pointer" }}
                onMouseEnter={() => setActive(ring.id)}
                onClick={() => setActive(ring.id)}
              />
            );
          })}

          {/* leader lines + readouts */}
          {RINGS.map((ring, i) => {
            const r = radiusFor(ring.weight);
            const angle = [-128, -20, 74][i]! * (Math.PI / 180);
            const x1 = CX + Math.cos(angle) * r;
            const y1 = CY + Math.sin(angle) * r;
            const x2 = CX + Math.cos(angle) * (r + 26);
            const y2 = CY + Math.sin(angle) * (r + 26);
            const anchor = Math.cos(angle) < -0.2 ? "end" : "start";
            const on = active === ring.id;
            const tx = x2 + (anchor === "end" ? -6 : 6);

            return (
              <motion.g
                key={`${ring.id}-r`}
                initial={reduced ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: reduced ? 0 : 0.5 + 0.12 * i }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActive(ring.id)}
                onClick={() => setActive(ring.id)}
              >
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ring.color} strokeWidth={on ? 1.4 : 0.8} opacity={on ? 1 : 0.55} />
                <circle cx={x1} cy={y1} r={2.2} fill={ring.color} />
                <text
                  x={tx}
                  y={y2 - 4}
                  textAnchor={anchor}
                  fill={ring.color}
                  className="font-mono"
                  style={{ fontSize: 9.5, letterSpacing: "0.18em" }}
                  opacity={on ? 1 : 0.7}
                >
                  {ring.short}
                </text>
                <text
                  x={tx}
                  y={y2 + 9}
                  textAnchor={anchor}
                  fill="#f0f6fc"
                  className="font-mono"
                  style={{ fontSize: 12.5, fontWeight: 600 }}
                  opacity={on ? 1 : 0.7}
                >
                  {ring.value}
                </text>
              </motion.g>
            );
          })}
        </svg>

        <p className="mt-1 text-center font-mono text-[10px] leading-relaxed text-mist">
          Area-proportional · tap a ring
        </p>
      </div>

      {/* ── the readout ────────────────────────────────────────────────── */}
      <div className="space-y-2 text-left">
        {RINGS.map((ring) => {
          const on = active === ring.id;
          return (
            <button
              key={ring.id}
              type="button"
              onMouseEnter={() => setActive(ring.id)}
              onClick={() => setActive(ring.id)}
              className={clsx(
                "block w-full border-l-2 py-2 pl-3.5 text-left transition-all",
                on ? "opacity-100" : "opacity-55",
              )}
              style={{ borderColor: on ? ring.color : "rgba(240,246,252,0.14)" }}
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span
                  className="font-mono text-[10px] tracking-[0.18em]"
                  style={{ color: ring.color }}
                >
                  {ring.short}
                </span>
                <span className="font-mono text-[15px] font-semibold text-ink">
                  {ring.value}
                </span>
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-fog">{ring.title}</p>
              <motion.div
                initial={false}
                animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">
                  {ring.why}
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-mist/80">
                  {ring.source}
                </p>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
