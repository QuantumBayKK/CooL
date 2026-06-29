import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface EvidenceField {
  label: string;
  value: string;
  /** Render the value in the accent color (e.g. a changed/verified value). */
  accent?: boolean;
}

export type EvidenceState = "neutral" | "cold" | "verified" | "alarm";

export interface EvidenceRecordProps {
  title?: string;
  fields: readonly EvidenceField[];
  state?: EvidenceState;
  /** Optional footer line (e.g. a hash or status). */
  footer?: string;
  sealed?: boolean;
  className?: string;
}

const STATE_RING: Record<EvidenceState, string> = {
  neutral: "border-white/10",
  cold: "border-[color-mix(in_oklab,var(--color-doubt)_60%,transparent)]",
  verified: "border-[color-mix(in_oklab,var(--color-verify)_55%,transparent)]",
  alarm: "border-[color-mix(in_oklab,var(--color-alarm)_60%,transparent)]",
};

const STATE_GLOW: Record<EvidenceState, string> = {
  neutral: "shadow-[0_0_0_0_transparent]",
  cold: "shadow-[0_0_60px_-20px_rgba(58,68,82,0.6)]",
  verified: "shadow-[0_0_80px_-20px_rgba(95,212,224,0.45)]",
  alarm: "shadow-[0_0_80px_-20px_rgba(224,100,79,0.5)]",
};

/**
 * A stylized "AI decision record" rendered as an instrument panel. Reused as the
 * fragile, mutable record (Ch.2) and — once sealed — the proven record (Ch.3+).
 */
export const EvidenceRecord = forwardRef<HTMLDivElement, EvidenceRecordProps>(
  function EvidenceRecord(
    { title = "AI Decision Record", fields, state = "neutral", footer, sealed, className },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "w-[min(92vw,30rem)] rounded-xl border bg-void-raised/80 p-7 backdrop-blur-sm transition-all duration-700",
          STATE_RING[state],
          STATE_GLOW[state],
          className,
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-caption uppercase tracking-[0.22em] text-mist">{title}</span>
          {sealed ? (
            <span className="text-caption uppercase tracking-[0.22em] text-verify">Sealed</span>
          ) : null}
        </div>

        <dl className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.label} className="flex items-baseline justify-between gap-6">
              <dt className="text-caption uppercase tracking-[0.18em] text-mist">{field.label}</dt>
              <dd
                className={cn(
                  "font-instrument text-body tabular-nums transition-colors duration-500",
                  field.accent ? "text-verify" : "text-paper",
                )}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        {footer ? (
          <p className="mt-6 truncate font-instrument text-caption text-mist">{footer}</p>
        ) : null}
      </div>
    );
  },
);
