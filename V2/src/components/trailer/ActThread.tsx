"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { Captions, Stage, Swing, type Beat } from "./Stage";
import { stagger, usePulse, useWindow } from "./motion";

/**
 * Act I — the thread.
 *
 * One hairline draws across the screen, sprouts the four surfaces that can
 * change, those branch into the actual things that changed, and the whole tree
 * funnels into a single sealed record.
 *
 * It is one continuous stage rather than four sections, and that is the entire
 * design. Cutting between "here is a line", "here are some boxes", "here is a
 * tree" would say the same words and show nothing: the reader would learn that
 * the product has parts. Keeping one shape on screen and deforming it says the
 * thing that actually matters — the tree *is* the line. One install grows into
 * full coverage without the reader enumerating anything.
 *
 * ── geometry ──
 *
 * Everything is laid out in one 1200×620 viewBox with the coordinates written
 * down as constants below, because the connectors have to land exactly on box
 * edges and eyeballing those in JSX produces a diagram that is subtly out of
 * true at every joint. The viewBox scales; the relationships do not move.
 */

/* ── the drawing ──────────────────────────────────────────────────────────── */

const VB = { w: 1200, h: 620 };

const SPINE = { y: 96, x0: 100, x1: 1100 };

const T1 = { y: 200, h: 70, w: 210, xs: [100, 366, 632, 898] } as const;
const T1_MID = T1.xs.map((x) => x + T1.w / 2);

const T2 = { y: 352, h: 56, w: 96 } as const;
/** Two children per parent, inset symmetrically about the parent's centre. */
const T2_MID = T1_MID.flatMap((mid) => [mid - 56, mid + 56]);

const SEAL = { y: 492, h: 84, w: 360, x: (VB.w - 360) / 2 } as const;
const SEAL_MID = VB.w / 2;

const SURFACES = ["Prompts", "Models", "Permissions", "Tools"] as const;

/** Concrete changes, not categories. A tree of nouns proves nothing. */
const CHANGES = [
  "system.md",
  "few-shot",
  "gpt-4o→o3",
  "temp 0.7",
  "db:write",
  "pii:read",
  "web.search",
  "code.exec",
] as const;

/* ── the script ───────────────────────────────────────────────────────────── */

const BEATS: readonly Beat[] = [
  {
    at: [0.0, 0.04, 0.15, 0.21],
    title: "One line. Then it is watching.",
    body: "No proxy to stand up, no sidecar to run, nothing rewired in your inference path.",
  },
  {
    at: [0.19, 0.25, 0.36, 0.42],
    title: "It finds every surface that can change.",
    body: "You do not enumerate them. Prompts, models, permissions and tools are discovered where they already live.",
  },
  {
    at: [0.4, 0.46, 0.6, 0.66],
    title: "Every edit becomes an event.",
    body: "A temperature nudge and a permission grant are the same kind of thing here — a change, with an author and a time.",
  },
  {
    at: [0.64, 0.7, 0.92, 1.0],
    title: "And every event lands in one sealed record.",
    body: "Signed where it happened, ordered in a log that cannot be rewritten behind you.",
  },
];

export function ActThread() {
  return (
    <Stage length={3.5} lengthSm={3} label="01 — Install" id="thread">
      {(p) => (
        <div className="flex h-full w-full max-w-[76rem] flex-col justify-center gap-6 py-24 sm:gap-10">
          <Captions progress={p} beats={BEATS} />
          {/* Two drawings of the same act, not one drawing that reflows.
              A viewBox scales uniformly, so the wide tree squeezed into a
              390px screen renders its 12px labels at about 3px — present,
              legible to nobody. The narrow variant re-lays the same story on
              a 620-unit canvas at roughly triple the effective type size, and
              drops the eight change nodes, which are the part that cannot
              survive the width. Both run off the same progress value and the
              same beat script. */}
          {/* The wide tree swings up out of depth as it draws. The narrow one
              gets a shallower version of the same move — at 390px a 26° tilt
              costs more legibility than it buys drama. */}
          <Swing progress={p} className="hidden md:block">
            <Thread progress={p} />
          </Swing>
          <Swing
            progress={p}
            className="md:hidden"
            rotateX={[14, 6, 0, -3]}
            rotateY={[-10, -4, 0, 3]}
            scale={[0.9, 0.96, 1, 0.99]}
          >
            <ThreadNarrow progress={p} />
          </Swing>
        </div>
      )}
    </Stage>
  );
}

/* ── the artwork ──────────────────────────────────────────────────────────── */

function Thread({ progress: p }: { progress: MotionValue<number> }) {
  const spine = useWindow(p, 0.0, 0.14);
  // The install chip arrives with the line and leaves once the tree starts
  // growing — it has said its piece, and leaving it up competes with the
  // branches for the same horizontal band.
  const chip = usePulse(p, 0.08, 0.16, 0.2, 0.28);
  const seal = useWindow(p, 0.74, 0.88);
  const sealScale = useTransform(seal, [0, 1], [0.94, 1]);
  const sealMark = useWindow(p, 0.86, 0.96);

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className="mx-auto max-h-[54vh] w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="One install line branching into prompts, models, permissions and tools, each emitting changes that funnel into a single sealed record."
    >
      {/* ── the spine — draws outward from the centre, so the line reads as
          something spreading rather than something being poured in from the
          left. Two halves because a single path can only draw from one end. */}
      {[
        `M ${VB.w / 2} ${SPINE.y} L ${SPINE.x0} ${SPINE.y}`,
        `M ${VB.w / 2} ${SPINE.y} L ${SPINE.x1} ${SPINE.y}`,
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={1.5}
          style={{ pathLength: spine }}
        />
      ))}

      {/* The install command, sitting on the line it describes. */}
      <motion.g style={{ opacity: chip }}>
        <rect
          x={VB.w / 2 - 132}
          y={SPINE.y - 34}
          width={264}
          height={30}
          rx={4}
          fill="var(--canvas)"
          stroke="var(--line-strong)"
        />
        <text
          x={VB.w / 2}
          y={SPINE.y - 13}
          textAnchor="middle"
          className="fill-ink font-mono"
          style={{ fontSize: 15 }}
        >
          npm i cool-nwc
        </text>
      </motion.g>

      {/* ── spine → surfaces ── */}
      {T1_MID.map((mid, i) => (
        <Drop
          key={`c1-${i}`}
          p={p}
          d={`M ${mid} ${SPINE.y} L ${mid} ${T1.y}`}
          at={stagger(i, 4, [0.17, 0.34])}
        />
      ))}

      {/* ── the four surfaces ── */}
      {SURFACES.map((label, i) => (
        <Box
          key={label}
          p={p}
          at={stagger(i, 4, [0.21, 0.42])}
          x={T1.xs[i]!}
          y={T1.y}
          w={T1.w}
          h={T1.h}
          label={label}
          size={17}
          weight={600}
        />
      ))}

      {/* ── surfaces → changes, as elbows ──
          An elbow rather than a diagonal: the whole design separates with
          orthogonal hairlines, and one set of diagonals in the middle of it
          reads as a different diagram pasted in. */}
      {T2_MID.map((mid, i) => {
        const parent = T1_MID[Math.floor(i / 2)]!;
        const knee = (T1.y + T1.h + T2.y) / 2;
        return (
          <Drop
            key={`c2-${i}`}
            p={p}
            d={`M ${parent} ${T1.y + T1.h} L ${parent} ${knee} L ${mid} ${knee} L ${mid} ${T2.y}`}
            at={stagger(i, 8, [0.36, 0.54])}
          />
        );
      })}

      {/* ── the changes ── */}
      {CHANGES.map((label, i) => (
        <Box
          key={label}
          p={p}
          at={stagger(i, 8, [0.4, 0.62])}
          live={stagger(i, 8, [0.58, 0.76], 0.4)}
          x={T2_MID[i]! - T2.w / 2}
          y={T2.y}
          w={T2.w}
          h={T2.h}
          label={label}
          size={12}
        />
      ))}

      {/* ── changes → seal ──
          Curves here, and only here. The funnel is the one place in the diagram
          where the message is convergence rather than structure, and a curve
          converges where a right angle merely arrives. */}
      {T2_MID.map((mid, i) => (
        <Drop
          key={`c3-${i}`}
          p={p}
          d={`M ${mid} ${T2.y + T2.h} C ${mid} ${SEAL.y - 26}, ${SEAL_MID} ${SEAL.y - 26}, ${SEAL_MID} ${SEAL.y}`}
          at={stagger(i, 8, [0.64, 0.82])}
          accent
        />
      ))}

      {/* ── the record ── */}
      <motion.g
        style={{
          opacity: seal,
          scale: sealScale,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        <rect
          x={SEAL.x}
          y={SEAL.y}
          width={SEAL.w}
          height={SEAL.h}
          rx={5}
          fill="var(--canvas)"
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
        <text
          x={SEAL_MID}
          y={SEAL.y + 34}
          textAnchor="middle"
          className="fill-ink font-mono"
          style={{ fontSize: 15 }}
        >
          change-receipt.json
        </text>
        <motion.text
          x={SEAL_MID}
          y={SEAL.y + 60}
          textAnchor="middle"
          className="fill-accent font-mono"
          style={{ fontSize: 12, letterSpacing: "0.12em", opacity: sealMark }}
        >
          ✓ SEALED · ML-DSA-65 + Ed25519
        </motion.text>
      </motion.g>
    </svg>
  );
}

/* ── the narrow variant ───────────────────────────────────────────────────── */

const NVB = { w: 620, h: 660 };
const N_SPINE = { y: 54, x0: 30, x1: 590 };
/** Two rows of two. Four columns cannot hold a readable label at this width. */
const N_BOX = { w: 268, h: 76 } as const;
const N_POS = [
  [30, 150],
  [322, 150],
  [30, 290],
  [322, 290],
] as const;
const N_MID = N_POS.map(([x]) => x + N_BOX.w / 2);

const N_SEAL = { x: 110, y: 470, w: 400, h: 96 } as const;
const N_SEAL_MID = N_SEAL.x + N_SEAL.w / 2;

function ThreadNarrow({ progress: p }: { progress: MotionValue<number> }) {
  const spine = useWindow(p, 0.0, 0.14);
  const chip = usePulse(p, 0.08, 0.16, 0.2, 0.28);
  const seal = useWindow(p, 0.72, 0.86);
  const sealScale = useTransform(seal, [0, 1], [0.94, 1]);
  const sealMark = useWindow(p, 0.84, 0.95);

  return (
    <svg
      viewBox={`0 0 ${NVB.w} ${NVB.h}`}
      className="mx-auto max-h-[46vh] w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="One install line branching into prompts, models, permissions and tools, all funnelling into a single sealed record."
    >
      {[
        `M ${NVB.w / 2} ${N_SPINE.y} L ${N_SPINE.x0} ${N_SPINE.y}`,
        `M ${NVB.w / 2} ${N_SPINE.y} L ${N_SPINE.x1} ${N_SPINE.y}`,
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="var(--ink)"
          strokeWidth={2}
          style={{ pathLength: spine }}
        />
      ))}

      <motion.g style={{ opacity: chip }}>
        <rect
          x={NVB.w / 2 - 150}
          y={N_SPINE.y - 44}
          width={300}
          height={38}
          rx={5}
          fill="var(--canvas)"
          stroke="var(--line-strong)"
        />
        <text
          x={NVB.w / 2}
          y={N_SPINE.y - 18}
          textAnchor="middle"
          className="fill-ink font-mono"
          style={{ fontSize: 21 }}
        >
          npm i cool-nwc
        </text>
      </motion.g>

      {/* spine → each surface, as an elbow through a shared bus line */}
      {N_POS.map(([x, y], i) => {
        const mid = x + N_BOX.w / 2;
        const bus = N_SPINE.y + 46;
        return (
          <Drop
            key={`nc-${i}`}
            p={p}
            d={`M ${NVB.w / 2} ${N_SPINE.y} L ${NVB.w / 2} ${bus} L ${mid} ${bus} L ${mid} ${y}`}
            at={stagger(i, 4, [0.17, 0.4])}
          />
        );
      })}

      {SURFACES.map((label, i) => {
        const [x, y] = N_POS[i]!;
        return (
          <NarrowSurface
            key={label}
            p={p}
            at={stagger(i, 4, [0.22, 0.5])}
            live={stagger(i, 4, [0.5, 0.72], 0.5)}
            x={x}
            y={y}
            label={label}
            sample={CHANGES[i * 2]!}
          />
        );
      })}

      {/* ── funnel into the record ──
          The top row cannot take the same curve as the bottom row. A single
          sweeping cubic from the upper boxes to the seal passes straight
          through the two boxes beneath them, striking out their labels — so
          the upper pair turns hard into the 24px gutter between the lower
          boxes first, and drops through it. The two upper curves merge into
          one line on the way down, which is what they are doing anyway. */}
      {N_MID.map((mid, i) => {
        const y = N_POS[i]![1] + N_BOX.h;
        const gutter = NVB.w / 2;
        const d =
          i < 2
            ? `M ${mid} ${y} C ${gutter} ${y}, ${gutter} ${y + 34}, ${gutter} ${y + 74} L ${gutter} ${N_SEAL.y}`
            : `M ${mid} ${y} C ${mid} ${N_SEAL.y - 44}, ${N_SEAL_MID} ${N_SEAL.y - 44}, ${N_SEAL_MID} ${N_SEAL.y}`;
        return (
          <Drop key={`nf-${i}`} p={p} d={d} at={stagger(i, 4, [0.62, 0.82])} accent />
        );
      })}

      <motion.g
        style={{
          opacity: seal,
          scale: sealScale,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        <rect
          x={N_SEAL.x}
          y={N_SEAL.y}
          width={N_SEAL.w}
          height={N_SEAL.h}
          rx={6}
          fill="var(--canvas)"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text
          x={N_SEAL_MID}
          y={N_SEAL.y + 40}
          textAnchor="middle"
          className="fill-ink font-mono"
          style={{ fontSize: 21 }}
        >
          change-receipt.json
        </text>
        <motion.text
          x={N_SEAL_MID}
          y={N_SEAL.y + 70}
          textAnchor="middle"
          className="fill-accent font-mono"
          style={{ fontSize: 16, letterSpacing: "0.1em", opacity: sealMark }}
        >
          ✓ SEALED
        </motion.text>
      </motion.g>
    </svg>
  );
}

/**
 * A surface box in the narrow variant.
 *
 * Carries one example change inside it rather than as a child node — the eight
 * separate change boxes are what makes the wide tree wide, and inlining a
 * single representative keeps the "it sees actual edits" beat without needing
 * a third tier the screen has no room for.
 */
function NarrowSurface({
  p,
  at,
  live,
  x,
  y,
  label,
  sample,
}: {
  p: MotionValue<number>;
  at: readonly [number, number];
  live: readonly [number, number];
  x: number;
  y: number;
  label: string;
  sample: string;
}) {
  const enter = useWindow(p, at[0], at[1]);
  const scale = useTransform(enter, [0, 1], [0.9, 1]);
  const lit = useWindow(p, live[0], live[1]);

  return (
    <motion.g
      style={{
        opacity: enter,
        scale,
        transformBox: "fill-box",
        transformOrigin: "center",
      }}
    >
      <rect
        x={x}
        y={y}
        width={N_BOX.w}
        height={N_BOX.h}
        rx={5}
        fill="var(--canvas)"
        stroke="var(--line-strong)"
      />
      <motion.rect
        x={x}
        y={y}
        width={N_BOX.w}
        height={N_BOX.h}
        rx={5}
        fill="var(--accent-wash)"
        stroke="var(--accent)"
        style={{ opacity: lit }}
      />
      <text
        x={x + N_BOX.w / 2}
        y={y + 32}
        textAnchor="middle"
        className="fill-ink font-mono"
        style={{ fontSize: 21, fontWeight: 600 }}
      >
        {label}
      </text>
      <motion.text
        x={x + N_BOX.w / 2}
        y={y + 58}
        textAnchor="middle"
        className="fill-ink-muted font-mono"
        style={{ fontSize: 16, opacity: lit }}
      >
        {sample}
      </motion.text>
    </motion.g>
  );
}

/* ── parts ────────────────────────────────────────────────────────────────── */

/** A connector that draws itself along its own length. */
function Drop({
  p,
  d,
  at,
  accent = false,
}: {
  p: MotionValue<number>;
  d: string;
  at: readonly [number, number];
  accent?: boolean;
}) {
  const pathLength = useWindow(p, at[0], at[1]);
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={accent ? "var(--accent)" : "var(--line-strong)"}
      strokeWidth={accent ? 1.25 : 1}
      style={{ pathLength }}
    />
  );
}

/**
 * A node.
 *
 * `live` is the second, later window that tints the box red — used on the
 * change row to sweep attention left to right once the tree is built, which is
 * how the diagram says "these are firing" without adding a spinner to each one.
 */
function Box({
  p,
  at,
  live,
  x,
  y,
  w,
  h,
  label,
  size,
  weight = 500,
}: {
  p: MotionValue<number>;
  at: readonly [number, number];
  live?: readonly [number, number];
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  size: number;
  weight?: number;
}) {
  const enter = useWindow(p, at[0], at[1]);
  const scale = useTransform(enter, [0, 1], [0.9, 1]);
  const lit = useWindow(p, live?.[0] ?? 2, live?.[1] ?? 3);

  return (
    <motion.g
      style={{
        opacity: enter,
        scale,
        transformBox: "fill-box",
        transformOrigin: "center",
      }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="var(--canvas)"
        stroke="var(--line-strong)"
      />
      {/* The tint is a second rect fading in over the first rather than an
          animated `stroke`, because interpolating a colour through a CSS
          variable is not something the compositor can do off the main thread —
          opacity is. */}
      {live && (
        <motion.rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={4}
          fill="var(--accent-wash)"
          stroke="var(--accent)"
          style={{ opacity: lit }}
        />
      )}
      <text
        x={x + w / 2}
        y={y + h / 2 + size * 0.35}
        textAnchor="middle"
        className="fill-ink font-mono"
        style={{ fontSize: size, fontWeight: weight }}
      >
        {label}
      </text>
    </motion.g>
  );
}
