import { Check, Minus } from "lucide-react";

import { Card, Eyebrow, StatusBadge, type Status } from "@/components/ui/primitives";
import { gateProgress, type Gate } from "@/content/gates";
import { cn } from "@/lib/utils";

/**
 * The readiness ladder.
 *
 * The claim sentence is the most important thing on each rung, so it is set in
 * the largest type in the card rather than tucked into a footnote. That is the
 * whole discipline this component exists to make visible: a gate is not a
 * feature list, it is permission to say one specific sentence.
 *
 * Progress is counted from the items, never estimated. A hand-written "80%
 * complete" is a number nobody can check, on a page whose entire argument is
 * that claims should be checkable.
 */
export function GateLadder({ gates }: { gates: readonly Gate[] }) {
  return (
    <ol className="flex flex-col gap-px bg-line">
      {gates.map((gate) => (
        <li key={gate.id}>
          <GateCard gate={gate} />
        </li>
      ))}
    </ol>
  );
}

const STATUS_TONE: Record<Gate["status"], Status> = {
  cleared: "ok",
  "in-progress": "warn",
  "not-started": "neutral",
};

const STATUS_LABEL: Record<Gate["status"], string> = {
  cleared: "cleared",
  "in-progress": "in progress",
  "not-started": "not started",
};

function GateCard({ gate }: { gate: Gate }) {
  const { done, total } = gateProgress(gate);

  return (
    <article className="bg-canvas p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow rule={false}>
          {gate.n === 0 ? "Stage 0" : `Gate ${gate.n}`} · {gate.name}
        </Eyebrow>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-ink-subtle" data-numeric>
            {done}/{total}
          </span>
          <StatusBadge status={STATUS_TONE[gate.status]}>
            {STATUS_LABEL[gate.status]}
          </StatusBadge>
        </div>
      </div>

      <p className="mt-3 max-w-[70ch] text-sm text-ink-muted">{gate.audience}</p>

      {/* The claim. Quoted, because it is a verbatim sentence and not a
          paraphrase — the point is that this exact wording is what becomes
          permissible, and nothing broader. */}
      <blockquote
        className={cn(
          "mt-5 border-l-2 pl-4",
          gate.status === "cleared" ? "border-ok" : "border-line-strong",
        )}
      >
        <p
          className={cn(
            "text-h4",
            gate.status === "cleared" ? "text-ink" : "text-ink-subtle",
          )}
        >
          &ldquo;{gate.claim}&rdquo;
        </p>
        <footer className="mt-1.5 text-xs text-ink-subtle">
          {gate.status === "cleared"
            ? "What we say today."
            : "Not yet sayable. The site's CI rejects it."}
        </footer>
      </blockquote>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {gate.groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-label uppercase text-ink-subtle">
              {group.title}
            </h3>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {group.items.map((item) => (
                <li key={item.label} className="flex gap-2.5">
                  {item.done ? (
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-ok"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    <Minus
                      className="mt-0.5 size-3.5 shrink-0 text-ink-subtle"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm",
                        item.done ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {item.label}
                    </p>
                    {item.note && (
                      <p className="mt-0.5 text-xs text-ink-subtle">
                        {item.note}
                      </p>
                    )}
                  </div>
                  {/* Screen-reader equivalent for the glyph, so state is never
                      carried by an icon alone. */}
                  <span className="sr-only">
                    {item.done ? "done" : "not done"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

/** Compact variant for the footer of other pages. */
export function GateSummary({ gates }: { gates: readonly Gate[] }) {
  return (
    <Card className="p-5">
      <ol className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-0">
        {gates.map((gate, i) => (
          <li key={gate.id} className="flex flex-1 items-center gap-2.5">
            <StatusBadge status={STATUS_TONE[gate.status]} glyph={false}>
              {gate.n === 0 ? "Stage 0" : `Gate ${gate.n}`}
            </StatusBadge>
            <span className="text-xs text-ink-muted">{gate.name}</span>
            {i < gates.length - 1 && (
              <span
                aria-hidden
                className="hidden h-px flex-1 bg-line sm:block"
              />
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}
