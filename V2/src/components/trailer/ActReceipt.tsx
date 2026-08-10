"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { Captions, Stage, type Beat } from "./Stage";
import { stagger, useIsWide, useWindow } from "./motion";

/**
 * Act II — the record, in three dimensions.
 *
 * A slab enters from the right edge, rotates through its own face as it
 * crosses, and settles flat in the centre with its fields legible. Three
 * satellite cards orbit behind it on separate depth planes.
 *
 * ── why 3D here and nowhere else ──
 *
 * Rotation is doing one specific job: showing that the receipt has a back. The
 * whole product claim is that a record is an object you can pick up and inspect
 * rather than a row in someone's database that you have to trust — and an
 * object that turns is the plainest way to say "this has sides, look at them".
 * Every other act stays flat, so the one thing that turns is the one thing the
 * reader is meant to pick up.
 *
 * ── how it stays cheap ──
 *
 * Everything animated here is `transform` and `opacity`, both of which the
 * compositor handles without touching layout or paint. No width, no top, no
 * box-shadow interpolation — a scroll-driven shadow is the classic way to turn
 * a smooth stage into a 15fps one, because every frame repaints the blur.
 *
 * The `perspective` lives on the container rather than on each card. On the
 * cards it would give each one its own vanishing point, and they would read as
 * three unrelated objects photographed separately instead of three objects in
 * one space.
 */

const BEATS: readonly Beat[] = [
  {
    at: [0.0, 0.05, 0.2, 0.28],
    title: "The record is an object, not a log line.",
    body: "It has fields, a signature, and a position in a log — all of which you can hold up to the light separately.",
  },
  {
    at: [0.26, 0.34, 0.56, 0.64],
    title: "It travels with the change.",
    body: "Into your SIEM, your ticket, your audit folder. The same bytes every time, with nothing added on the way.",
  },
  {
    at: [0.62, 0.7, 0.92, 1.0],
    title: "And it checks out anywhere.",
    body: "Offline, on a laptop you own, against a verifier we do not control.",
  },
];

const FIELDS = [
  ["core", "prompt.system · v41 → v42"],
  ["author", "d.okafor@ · policy PR-2291"],
  ["binding", "sha256:9f2c…4e1a"],
  ["signature", "ML-DSA-65 + Ed25519"],
  ["log_entry", "leaf 148 202 · RFC 6962"],
] as const;

/** The places a record lands. Rendered as cards on their own depth planes. */
const DESTINATIONS = [
  { label: "Splunk", detail: "cool:change · indexed" },
  { label: "Jira", detail: "AUD-2291 · attached" },
  { label: "S3", detail: "evidence/2026-08/" },
] as const;

export function ActReceipt() {
  return (
    <Stage length={3.25} lengthSm={2.75} label="02 — The record" id="record">
      {(p) => (
        <div className="flex h-full w-full max-w-[76rem] flex-col justify-center gap-8 py-24 sm:gap-12">
          <Captions progress={p} beats={BEATS} />
          <Scene progress={p} />
        </div>
      )}
    </Stage>
  );
}

function Scene({ progress: p }: { progress: MotionValue<number> }) {
  /* ── the slab ──
     One continuous path across the whole act, keyed at four points rather than
     animated in segments: enters from the right, crosses, settles centre to be
     read, then slides left to make room for the destinations. Keyframing the
     whole journey on one timeline is what keeps the motion continuous —
     chaining three separate transitions produces a visible stop at each
     handover.

     The final leg travels `-34%` and not the `-4%` it started as. Percentages
     in a CSS transform resolve against the element's OWN width, not the
     container's, so a small number here moves the 480px slab by a few pixels
     and leaves it sitting exactly where the destination cards want to be. The
     first version of this act shipped that mistake: the cards were behind an
     opaque slab and invisible for the whole second half. */
  const wide = useIsWide();

  const x = useTransform(
    p,
    [0, 0.32, 0.6, 1],
    ["62%", "0%", "0%", wide ? "-34%" : "0%"],
  );
  // 78° at entry means the reader genuinely sees the card edge-on and watches
  // it turn — at the 52° this started on it read as a tilted rectangle rather
  // than as an object with a back.
  const rotateY = useTransform(p, [0, 0.32, 0.6, 1], [-78, -10, 0, wide ? 11 : 0]);
  const rotateX = useTransform(p, [0, 0.32, 0.6, 1], [22, 5, 0, -3]);
  const z = useTransform(p, [0, 0.32, 0.6, 1], [-420, -40, 0, -90]);
  const scale = useTransform(p, [0, 0.32, 0.6, 1], [0.9, 0.99, 1, wide ? 0.94 : 1]);
  const enter = useWindow(p, 0.0, 0.12);

  // Fields arrive after the slab has stopped turning. Reading a list while it
  // rotates is not possible, and asking the reader to try is what makes a
  // rotating card feel like decoration instead of content.
  const fields = useWindow(p, 0.34, 0.5);

  return (
    <div className="mx-auto w-full">
      <div
        className="relative flex h-[clamp(17rem,38vh,25rem)] w-full items-center justify-center"
        style={{ perspective: "1400px" }}
      >
      {/* ── destinations ──
          A receding stack on the right, arriving as the slab clears out of the
          way. They are what turns "here is a receipt" into "here is where the
          receipt goes".

          Anchored to the container's right edge with CSS rather than pushed
          there with a percentage transform, for the reason in the slab comment
          above. Motion only handles depth, tilt and fade from here — the layout
          is layout. Hidden below `lg`, where there is no room beside a 480px
          card; the mobile fallback is a flat row underneath. */}
        <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {DESTINATIONS.map((d, i) => (
            <Satellite key={d.label} p={p} index={i} {...d} />
          ))}
        </div>

        {/* ── the slab ── */}
        <motion.div
          className="relative w-[min(30rem,92vw)] border border-line bg-canvas"
          style={{
            x,
            rotateY,
            rotateX,
            z,
            scale,
            opacity: enter,
            transformStyle: "preserve-3d",
            boxShadow: "var(--shadow-modal)",
          }}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-subtle">
              change-receipt.json
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-[--radius-xs] border border-accent/25 bg-accent-wash px-2 py-0.5 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-accent">
              <span aria-hidden>✓</span> sealed
            </span>
          </div>

          <motion.dl className="divide-y divide-line" style={{ opacity: fields }}>
            {FIELDS.map(([k, v], i) => (
              <Field key={k} p={p} index={i} label={k} value={v} />
            ))}
          </motion.dl>
        </motion.div>
      </div>

      <DestinationRow p={p} />
    </div>
  );
}

function Field({
  p,
  index,
  label,
  value,
}: {
  p: MotionValue<number>;
  index: number;
  label: string;
  value: string;
}) {
  const [a, b] = stagger(index, FIELDS.length, [0.36, 0.56]);
  const opacity = useWindow(p, a, b);
  const x = useTransform(opacity, [0, 1], [-6, 0]);

  return (
    <motion.div
      className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-2.5"
      style={{ opacity, x }}
    >
      <dt className="font-mono text-[0.75rem] text-ink-subtle">{label}</dt>
      <dd className="truncate font-mono text-[0.75rem] text-ink">{value}</dd>
    </motion.div>
  );
}

/**
 * A destination card.
 *
 * Slides in from the right and rotates to face the reader, each one a little
 * deeper than the last. `translateZ` rather than `scale` for the depth:
 * against the shared perspective, Z gives true foreshortening — the far cards
 * shrink *and* shift toward the vanishing point, which is the cue that sells
 * the space as three-dimensional rather than as three cards of different sizes.
 */
function Satellite({
  p,
  index,
  label,
  detail,
}: {
  p: MotionValue<number>;
  index: number;
  label: string;
  detail: string;
}) {
  const [a, b] = stagger(index, DESTINATIONS.length, [0.62, 0.92]);
  const enter = useWindow(p, a, b);

  const x = useTransform(enter, [0, 1], [70, 0]);
  const z = useTransform(enter, [0, 1], [-140, -index * 60]);
  const rotateY = useTransform(enter, [0, 1], [-30, -14]);

  return (
    <motion.div
      className="w-[14rem] border border-line bg-surface px-3.5 py-3"
      style={{ x, z, rotateY, opacity: enter }}
    >
      <p className="text-h4 leading-none">{label}</p>
      <p className="mt-1.5 font-mono text-[0.6875rem] text-ink-subtle">{detail}</p>
    </motion.div>
  );
}

/**
 * The same three destinations, flat, for phones.
 *
 * Below `lg` there is no horizontal room for a receding stack beside a 480px
 * card, and shrinking the whole scene to make room would leave the receipt
 * fields — the point of the act — too small to read. So the depth is dropped
 * rather than the content: same copy, same timing, laid out as a row.
 */
function DestinationRow({ p }: { p: MotionValue<number> }) {
  return (
    <div className="mt-5 grid grid-cols-3 gap-2 lg:hidden">
      {DESTINATIONS.map((d, i) => {
        const [a, b] = stagger(i, DESTINATIONS.length, [0.62, 0.92]);
        return <FlatDestination key={d.label} p={p} at={[a, b]} {...d} />;
      })}
    </div>
  );
}

function FlatDestination({
  p,
  at,
  label,
  detail,
}: {
  p: MotionValue<number>;
  at: readonly [number, number];
  label: string;
  detail: string;
}) {
  const opacity = useWindow(p, at[0], at[1]);
  const y = useTransform(opacity, [0, 1], [10, 0]);

  return (
    <motion.div
      className="border border-line bg-surface px-2.5 py-2"
      style={{ opacity, y }}
    >
      <p className="text-sm font-semibold leading-none">{label}</p>
      <p className="mt-1 truncate font-mono text-[0.625rem] text-ink-subtle">
        {detail}
      </p>
    </motion.div>
  );
}
