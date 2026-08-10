"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { Captions, Stage, type Beat } from "./Stage";
import { stagger, useRamp, useWindow } from "./motion";

/**
 * Act III — the console assembles, then hands you the quarter in one file.
 *
 * The brief for this act was "show that it saves time, from installing to uses
 * to reports — don't explain the tech, showcase it", and that rules out the two
 * obvious moves. No screenshot: a static image of a dashboard is a claim that
 * a dashboard exists. No feature list: a bulleted list of capabilities is the
 * explaining that was ruled out.
 *
 * So the console builds itself in front of the reader, in the order the work
 * actually happens — tiles, then volume, then the live feed, then the export —
 * and the last beat is the one that carries the argument. A quarter of evidence
 * leaving as a single signed file *is* the time saving. Nothing has to say the
 * words "saves time"; the next section does the arithmetic.
 *
 * Every number here is a plausible operating figure for a mid-size estate, and
 * `verify failures 0` is the only one that is a claim rather than a texture —
 * it is what the console would show if the pipeline is doing its job.
 */

const BEATS: readonly Beat[] = [
  {
    at: [0.0, 0.05, 0.2, 0.27],
    title: "Then you just look.",
    body: "Every sealed change across every model, in one place, the moment it lands.",
  },
  {
    at: [0.25, 0.32, 0.52, 0.59],
    title: "Ask it what an auditor would ask.",
    body: "Which prompts changed under scope last quarter, who approved them, and what did the verifier say. Two clicks, not two weeks.",
  },
  {
    at: [0.57, 0.65, 0.9, 1.0],
    title: "Take the whole quarter as one file.",
    body: "Signed, ordered, and checkable by someone who has never heard of us.",
  },
];

const TILES = [
  { k: "Changes sealed", v: "12,847", note: "this quarter" },
  { k: "Surfaces watched", v: "63", note: "auto-discovered" },
  { k: "Verify failures", v: "0", note: "12,847 checked" },
  { k: "Median seal", v: "41ms", note: "out of band" },
] as const;

/** Twelve weeks of change volume. Shape matters, exact values do not. */
const BARS = [38, 52, 44, 61, 49, 73, 66, 58, 81, 69, 92, 77] as const;

const FEED = [
  { what: "prompt.system", change: "v41 → v42", who: "d.okafor" },
  { what: "model.router", change: "gpt-4o → o3", who: "ci-bot" },
  { what: "perm.db", change: "write granted", who: "s.raman" },
  { what: "tool.web", change: "search enabled", who: "d.okafor" },
] as const;

export function ActDashboard() {
  return (
    <Stage length={3.25} lengthSm={2.75} label="03 — Console & reports" id="console-act">
      {(p) => (
        <div className="flex h-full w-full max-w-[76rem] flex-col justify-center gap-8 py-24 sm:gap-10">
          <Captions progress={p} beats={BEATS} />
          <Console progress={p} />
        </div>
      )}
    </Stage>
  );
}

function Console({ progress: p }: { progress: MotionValue<number> }) {
  /* Arrive, hold, then recede as the export comes forward — one keyframed
     timeline rather than two windows combined per frame. The console does not
     vanish at the end: the report is a thing produced *by* what is behind it,
     and cutting the console would break that causal read.

     Opacity goes through `useRamp` (callback form) and scale through the range
     form. That asymmetry is deliberate — see the block comment in `motion.ts`:
     a range-form opacity gets hardware-accelerated onto a ScrollTimeline whose
     range does not match this pinned stage, and runs backwards. */
  const opacity = useRamp(p, [0, 0.1, 0.66, 0.82], [0, 1, 1, 0.32]);
  const scale = useTransform(p, [0, 0.1, 0.66, 0.82], [0.9, 1, 1, 0.92]);

  /* The console arrives tilted back and pushed away, straightens while it
     fills, then leans away again as the export comes forward past it. The
     lean-away is what makes the report read as being *in front of* the
     console rather than merely on top of it — two objects at different
     depths, not two stacked rectangles. */
  const rotateX = useTransform(p, [0, 0.12, 0.66, 0.9], [18, 0, 0, 12]);
  const z = useTransform(p, [0, 0.12, 0.66, 0.9], [-260, 0, 0, -200]);

  return (
    <div
      className="relative mx-auto w-full max-w-[62rem]"
      style={{ perspective: "1600px" }}
    >
      <motion.div
        // `data-surface="console"` flips the accent from brand red to ink for
        // everything inside: in the product, red means failure and nothing else.
        // The one red thing left below is the failure count, which is zero.
        data-surface="console"
        className="overflow-hidden border border-line bg-canvas"
        style={{ opacity, scale, rotateX, z, transformStyle: "preserve-3d" }}
      >
        {/* ── chrome ── */}
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-subtle">
            cool console · evidence
          </p>
          <p className="font-mono text-[0.6875rem] text-ink-subtle">
            2026 Q2 · all surfaces
          </p>
        </div>

        {/* ── tiles ── */}
        <div className="rule-grid grid grid-cols-2 border-l-0 border-t-0 lg:grid-cols-4">
          {TILES.map((t, i) => (
            <Tile key={t.k} p={p} index={i} {...t} />
          ))}
        </div>

        {/* Below `lg` these stack, which makes the panel about 220px taller
            than the pinned viewport has left after the captions — the bottom
            of the live feed was being cut off mid-row. The volume chart is the
            half that survives being dropped: it carries texture, while the
            feed carries the act's actual claim, that individual changes land
            here as they happen. */}
        <div className="grid gap-px bg-line lg:grid-cols-[1.15fr_1fr]">
          {/* ── volume ── */}
          <div className="hidden bg-canvas p-4 lg:block">
            <p className="text-label uppercase text-ink-subtle">
              Sealed changes · 12 weeks
            </p>
            <div className="mt-4 flex h-[5.5rem] items-end gap-1.5">
              {BARS.map((h, i) => (
                <Bar key={i} p={p} index={i} height={h} />
              ))}
            </div>
          </div>

          {/* ── feed ── */}
          <div className="bg-canvas p-4">
            <p className="text-label uppercase text-ink-subtle">Live</p>
            <ul className="mt-3 flex flex-col">
              {FEED.map((row, i) => (
                <FeedRow key={row.what} p={p} index={i} {...row} />
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <ExportCard p={p} />
    </div>
  );
}

/* ── parts ────────────────────────────────────────────────────────────────── */

function Tile({
  p,
  index,
  k,
  v,
  note,
}: {
  p: MotionValue<number>;
  index: number;
  k: string;
  v: string;
  note: string;
}) {
  const [a, b] = stagger(index, TILES.length, [0.06, 0.26]);
  const opacity = useWindow(p, a, b);
  const y = useTransform(opacity, [0, 1], [10, 0]);

  return (
    <motion.div className="bg-canvas p-4" style={{ opacity, y }}>
      <p className="text-label uppercase text-ink-subtle">{k}</p>
      <p className="tnum mt-1.5 font-editorial text-h2 leading-none">{v}</p>
      <p className="mt-1 text-xs text-ink-subtle">{note}</p>
    </motion.div>
  );
}

/** Grows from its base. `transformOrigin: bottom` — a bar that scales from its
 *  centre grows downward through the axis, which reads as a rendering fault. */
function Bar({
  p,
  index,
  height,
}: {
  p: MotionValue<number>;
  index: number;
  height: number;
}) {
  const [a, b] = stagger(index, BARS.length, [0.2, 0.46], 0.35);
  const scaleY = useWindow(p, a, b);

  return (
    <motion.div
      className="flex-1 origin-bottom bg-ink"
      style={{ height: `${height}%`, scaleY }}
    />
  );
}

function FeedRow({
  p,
  index,
  what,
  change,
  who,
}: {
  p: MotionValue<number>;
  index: number;
  what: string;
  change: string;
  who: string;
}) {
  const [a, b] = stagger(index, FEED.length, [0.3, 0.56]);
  const opacity = useWindow(p, a, b);
  const x = useTransform(opacity, [0, 1], [-8, 0]);

  return (
    <motion.li
      className="flex items-baseline justify-between gap-3 border-b border-line py-2 last:border-b-0"
      style={{ opacity, x }}
    >
      <span className="min-w-0">
        <span className="font-mono text-[0.75rem] text-ink">{what}</span>{" "}
        <span className="font-mono text-[0.75rem] text-ink-subtle">{change}</span>
      </span>
      <span className="shrink-0 font-mono text-[0.6875rem] text-ink-subtle">
        {who} ✓
      </span>
    </motion.li>
  );
}

/**
 * The export, arriving in front of the console it came from.
 *
 * This is the act's punchline, so it gets the only red on the surface and the
 * only elevation. It comes forward in Z rather than sliding in from an edge:
 * sliding says "here is another panel", coming forward says "here is that,
 * condensed".
 */
function ExportCard({ p }: { p: MotionValue<number> }) {
  const enter = useWindow(p, 0.68, 0.86);
  const y = useTransform(enter, [0, 1], [40, 0]);
  const z = useTransform(enter, [0, 1], [-120, 90]);
  const rotateX = useTransform(enter, [0, 1], [12, 0]);
  const tick = useWindow(p, 0.86, 0.96);

  return (
    <motion.div
      className="absolute inset-x-0 bottom-[-1.5rem] mx-auto w-[min(30rem,90%)] border border-accent bg-canvas"
      style={{
        opacity: enter,
        y,
        z,
        rotateX,
        boxShadow: "var(--shadow-modal)",
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[0.8125rem] text-ink">
            evidence-pack-2026-Q2.zip
          </p>
          <p className="mt-0.5 font-mono text-[0.6875rem] text-ink-subtle">
            12,847 records · 1 signed manifest
          </p>
        </div>
        <motion.span
          className="shrink-0 rounded-[--radius-xs] border border-accent/25 bg-accent-wash px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-accent"
          style={{ opacity: tick }}
        >
          ✓ exported
        </motion.span>
      </div>
    </motion.div>
  );
}
