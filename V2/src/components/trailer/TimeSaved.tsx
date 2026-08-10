"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "motion/react";
import { useEffect, useRef } from "react";

import { Container, Eyebrow } from "@/components/ui/primitives";
import { CINE_EASE } from "./motion";

/**
 * The arithmetic.
 *
 * Three acts of animation have shown the reader what the product does. This
 * section is where the trailer stops showing and states the consequence, and
 * it is deliberately the plainest thing on the page: a table, hairlines, big
 * numbers. After several screens of motion, stillness is the emphasis.
 *
 * ── on the honesty of these numbers ──
 *
 * They are labelled "typical" rather than presented as measured results,
 * because that is what they are: the "before" column is the ordinary shape of
 * manual evidence collection, and the "after" column is what the pipeline in
 * the acts above produces. The site's whole argument is that it does not ask
 * to be believed, so a fabricated case study with a customer name would
 * undercut every other claim on the page. A stated, checkable estimate does
 * not.
 *
 * ── why it is not a pinned stage ──
 *
 * A number that counts up is already a timed animation, and pinning it would
 * put the reader's scroll and the count in competition — scroll faster and the
 * number lands before you read the label. This fires once on entry and holds.
 */

/**
 * `v: null` means "there is no number, because the thing cannot be done" — it
 * renders as an em dash. It is distinct from `v: 0`, which is a real measured
 * zero and counts like any other figure. Collapsing the two was the first
 * version of this table and it produced "0 work" for a genuine zero sitting
 * next to "— —" for an impossibility, which read as two rendering faults
 * rather than as the two different claims they are.
 */
const ROWS = [
  {
    task: "Prove what changed in a prompt, and who approved it",
    before: { v: 3, unit: "days", note: "git archaeology, Slack, memory" },
    after: { v: 4, unit: "seconds", note: "one query" },
  },
  {
    task: "Assemble an evidence pack for one audit period",
    before: { v: 6, unit: "weeks", note: "screenshots and spreadsheets" },
    after: { v: 1, unit: "export", note: "signed manifest" },
  },
  {
    task: "Answer “has this record been altered?”",
    before: { v: null, unit: "no answer", note: "nothing to check against" },
    after: { v: 200, unit: "ms", note: "offline, on your machine" },
  },
  {
    task: "Onboard a new model to the same guarantees",
    before: { v: 2, unit: "sprints", note: "bespoke logging per surface" },
    after: { v: 0, unit: "extra work", note: "discovered automatically" },
  },
] as const;

export function TimeSaved() {
  return (
    <section className="section-y border-t border-line bg-surface">
      <Container>
        <Eyebrow>04 — What it costs you now</Eyebrow>

        <h2 className="mt-4 max-w-[22ch] text-h2">
          The saving is not the sealing. It is never assembling any of this
          again.
        </h2>
        <p className="mt-4 max-w-[52ch] text-lead text-ink-muted">
          Typical figures for a mid-size estate. The left column is what
          collecting this evidence by hand actually takes; the right is what the
          pipeline above produces as a side effect of running.
        </p>

        <div className="mt-12 border-t border-line">
          {ROWS.map((row, i) => (
            <Row key={row.task} row={row} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function Row({
  row,
  index,
}: {
  row: (typeof ROWS)[number];
  index: number;
}) {
  return (
    <div className="grid items-baseline gap-4 border-b border-line py-6 md:grid-cols-[1fr_auto_auto] md:gap-10">
      <p className="max-w-[40ch] text-body text-ink">{row.task}</p>

      <div className="flex items-baseline gap-8 md:gap-10">
        <Figure
          value={row.before.v}
          unit={row.before.unit}
          note={row.before.note}
          index={index}
          tone="before"
        />
        <span aria-hidden className="text-ink-subtle">
          →
        </span>
        <Figure
          value={row.after.v}
          unit={row.after.unit}
          note={row.after.note}
          index={index}
          tone="after"
        />
      </div>
    </div>
  );
}

/**
 * One figure, counting up on entry.
 *
 * `tabular-nums` via `.tnum` is not cosmetic here: proportional digits change
 * width as they tick, so an animated counter physically jitters and drags the
 * unit label back and forth beside it. It is the single most common bug in
 * count-up components, and it is invisible until the number crosses a 1.
 *
 * ── the counter rests at its final value, not at zero ──
 *
 * The intuitive implementation seeds the motion value at 0 and animates up
 * when the row scrolls into view. That publishes a lie for every row below the
 * fold: this is a table of durations, so a row sitting at "0 weeks → 0 export"
 * until the reader reaches it is not obviously un-animated — it reads as a
 * measured claim, and a wrong one. Caught in a screenshot mid-scroll, where
 * row one read "3 days → 4 seconds" and row two read "0 → 0".
 *
 * So the value starts correct and the effect knocks it down to 0 at the moment
 * it enters the viewport, immediately before animating back. The reader still
 * sees a count-up; nobody ever sees a false zero.
 */
function Figure({
  value,
  unit,
  note,
  index,
  tone,
}: {
  /** `null` renders an em dash: no number exists, because the task is impossible. */
  value: number | null;
  unit: string;
  note: string;
  index: number;
  tone: "before" | "after";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();

  const count = useMotionValue(value ?? 0);
  const shown = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView || reduced || value === null || value === 0) return;
    count.set(0);
    const controls = animate(count, value, {
      duration: 0.9,
      delay: index * 0.06,
      ease: CINE_EASE,
    });
    return () => controls.stop();
  }, [inView, reduced, value, index, count]);

  const muted = tone === "before";

  return (
    <div ref={ref} className="min-w-[6.5rem]">
      {/* The visible number is mid-animation for most of its first second, so
          the accessible name is the final value stated once. A screen reader
          walking a counting element otherwise announces whatever integer
          happened to be rendered when focus reached it. */}
      <p
        className={`tnum font-display text-h1 leading-none ${
          muted ? "text-ink-subtle" : "text-ink"
        }`}
        aria-label={value === null ? unit : `${value} ${unit}`}
      >
        <span aria-hidden>
          {value === null ? "—" : <motion.span>{shown}</motion.span>}{" "}
          <span className="text-h4 font-normal">{unit}</span>
        </span>
      </p>
      <p
        className={`mt-1.5 text-xs ${
          muted ? "text-ink-subtle" : "text-accent"
        }`}
      >
        {note}
      </p>
    </div>
  );
}
