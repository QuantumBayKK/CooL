"use client";

/**
 * Acts two to six — the cascade.
 *
 * Nobody clicked anything. That is the only claim this act has to land, so the
 * staging is built around it: the engineer's editor is still on screen, greyed
 * back, and everything new arrives on its own.
 *
 * On pacing. The work finishes in a few milliseconds — ML-DSA-65 is fast and
 * there is exactly one record — so if the steps were revealed as they completed
 * the entire cascade would be a single frame. That is a real result and a
 * useless demo. So the work is done up front and the reveal is paced, and the
 * timing panel prints the measured duration of each step next to it, which is
 * both the honest disclosure and the more impressive number. A presenter can
 * say "all of that took eleven milliseconds; I am slowing it down so you can
 * read it", which is a better line than anything a fake progress bar buys.
 *
 * The `STAGED` badge on step one is not decoration. A browser tab has no git,
 * so the commit metadata is invented, and the badge is rendered from the step's
 * own `truth` field — you cannot relabel it without changing what it does.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import type { CascadeStep } from "@/lib/story/cascade";
import { Label, Panel, Pill } from "./ui";

/** Milliseconds between reveals. Tuned so seven steps land in about five seconds. */
const BEAT = 620;
/** How long a step shows its spinner before resolving. */
const WORK = 260;

export function CascadeScene({
  steps,
  onDone,
  replayKey,
}: {
  steps: readonly CascadeStep[];
  onDone: () => void;
  /** Changing this restarts the reveal — the presenter's replay button. */
  replayKey: number;
}) {
  /** How many steps have started. */
  const [started, setStarted] = useState(0);
  /** How many have resolved. */
  const [done, setDone] = useState(0);
  const timers = useRef<number[]>([]);
  const notified = useRef(false);

  // Held in a ref rather than named as a dependency. The caller passes an inline
  // arrow, so its identity changes on every render of the shell; depending on it
  // would tear down and restart the schedule each time and the cascade would sit
  // on step one forever. The effect wants to re-run when the STEPS change, which
  // is what it now says.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Follow the newest card. Seven steps do not fit a laptop screen, and a
  // presenter reaching for the scrollbar mid-cascade is the one moment where
  // the demo stops looking like something that happened by itself.
  const scroller = useRef<HTMLDivElement>(null);
  const tail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (started === 0) return;
    tail.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [started]);

  useEffect(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setStarted(0);
    setDone(0);
    notified.current = false;

    steps.forEach((_, index) => {
      timers.current.push(
        window.setTimeout(() => setStarted(index + 1), index * BEAT),
      );
      timers.current.push(
        window.setTimeout(() => {
          setDone(index + 1);
          if (index === steps.length - 1 && !notified.current) {
            notified.current = true;
            onDoneRef.current();
          }
        }, index * BEAT + WORK),
      );
    });

    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, [steps, replayKey]);

  const total = steps.reduce((sum, step) => sum + step.ms, 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* the notification — the first thing that happens, unprompted */}
      <div className="story-drop shrink-0">
        <Panel className="flex items-center gap-3 px-4 py-3">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(63,185,80,0.14)" }}
          >
            <Check size={16} style={{ color: "var(--color-live)" }} />
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-medium text-ink">Prompt change detected</div>
            <div className="truncate text-[11.5px] text-mist">
              No one opened a ticket, filled in a form, or wrote a change note.
            </div>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <div className="font-mono text-[11px] text-mist">total compute</div>
            <div className="font-mono text-[13px] text-live">
              {done >= steps.length ? `${total.toFixed(1)} ms` : "…"}
            </div>
          </div>
        </Panel>
      </div>

      {/* the steps */}
      <div ref={scroller} className="thin-scroll min-h-0 flex-1 overflow-y-auto pr-1">
        <ol className="relative flex flex-col gap-2.5">
          {steps.map((step, index) => {
            const isStarted = index < started;
            const isDone = index < done;
            if (!isStarted) return null;
            return (
              <li key={step.id} className="story-rise">
                <StepCard step={step} resolved={isDone} last={index === steps.length - 1} />
              </li>
            );
          })}
        </ol>
        <div ref={tail} />
      </div>
    </div>
  );
}

function StepCard({
  step,
  resolved,
  last,
}: {
  step: CascadeStep;
  resolved: boolean;
  last: boolean;
}) {
  const accent = !resolved
    ? "var(--color-mist)"
    : step.ok
      ? "var(--color-live)"
      : "var(--color-fail)";

  return (
    <Panel
      className="overflow-hidden"
      style={{
        borderColor: resolved && last ? "rgba(63,185,80,0.45)" : undefined,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          className="mt-[2px] grid size-6 shrink-0 place-items-center rounded-full"
          style={{ background: resolved ? "rgba(63,185,80,0.13)" : "rgba(139,148,158,0.12)" }}
        >
          {resolved ? (
            last ? (
              <ShieldCheck size={13} style={{ color: accent }} />
            ) : (
              <Check size={13} style={{ color: accent }} />
            )
          ) : (
            <Loader2 size={13} className="animate-spin" style={{ color: accent }} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-medium text-ink">{step.title}</span>
            <Pill tone={step.truth === "computed" ? "verify" : "warn"} glyph={false}>
              {step.truth === "computed" ? "computed live" : "staged"}
            </Pill>
            {resolved && step.ms > 0 && (
              <span className="ml-auto font-mono text-[11px] text-mist">
                {step.ms.toFixed(1)} ms
              </span>
            )}
          </div>

          <p className="mt-1 text-[12px] leading-relaxed text-mist">{step.note}</p>

          {resolved && (
            <div className="mt-2.5 grid gap-x-6 gap-y-0 border-t border-line pt-2 sm:grid-cols-2">
              {step.fields.map((field) => (
                <div key={field.k} className="flex items-baseline justify-between gap-3 py-[3px]">
                  <span className="shrink-0 text-[11px] text-mist">{field.k}</span>
                  <span
                    className={`min-w-0 truncate text-right text-[11.5px] text-fog ${
                      field.mono ? "font-mono" : ""
                    }`}
                    title={field.v}
                  >
                    {field.v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {resolved && last && (
        <div
          className="border-t px-4 py-2"
          style={{ borderColor: "rgba(63,185,80,0.25)", background: "rgba(63,185,80,0.06)" }}
        >
          <Label>
            <span style={{ color: "var(--color-live)" }}>
              Documentation, governance, approval, evidence and proof — from one save
            </span>
          </Label>
        </div>
      )}
    </Panel>
  );
}
