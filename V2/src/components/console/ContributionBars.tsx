"use client";

/**
 * The risk score, taken apart.
 *
 * This is the chart that makes the model interrogable rather than oracular:
 * each bar is one feature's `weight × value` push on the logit, and the bars
 * sum to the score. An operator who disagrees with a score can see exactly
 * which signal produced it and go argue with that signal.
 *
 * It is one series over ordered features, so every bar takes the same hue and
 * there is no legend. The top driver is emphasised — that is the one the
 * recommended fix is keyed to, and emphasis is the honest way to say "look
 * here" without spending the identity channel.
 */
import { MARK, barPathH } from "./viz";
import { SERIES } from "@/lib/console-theme";
import type { FeatureContribution } from "@/lib/dashboard/risk";

export function ContributionBars({
  contributions,
  max,
}: {
  contributions: readonly FeatureContribution[];
  /** Shared across cards so two decompositions can be compared by eye. */
  max?: number;
}) {
  const scaleMax = max ?? Math.max(0.5, ...contributions.map((c) => c.contribution));

  return (
    <ul className="space-y-2">
      {contributions.map((contribution, i) => {
        const width = Math.max(0, (contribution.contribution / scaleMax) * 100);
        const leading = i === 0 && contribution.contribution > 0.05;
        return (
          <li key={contribution.key} style={{ minHeight: MARK.minHitTarget }}>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={`truncate text-[12px] ${leading ? "text-ink" : "text-fog"}`}
                title={contribution.label}
              >
                {contribution.label}
              </span>
              <span className="shrink-0 tnum text-[11px] text-mist">
                {contribution.weight.toFixed(1)} × {contribution.value.toFixed(2)} ={" "}
                <span className={leading ? "text-ink" : "text-fog"}>
                  {contribution.contribution.toFixed(2)}
                </span>
              </span>
            </div>
            <svg
 viewBox="0 0 100 6"
 width="100%"
              height={6}
 preserveAspectRatio="none"
              aria-hidden
 className="mt-1"
            >
              <rect x={0} y={0} width={100} height={6} fill="rgba(223,228,234,0.05)" />
              <path
                d={barPathH(0, 0, width, 6, 2)}
                fill={SERIES[0]}
                // The non-leading drivers recede rather than change hue, so the
                // emphasis never reads as a second category.
                opacity={leading ? 1 : 0.45}
              />
            </svg>
          </li>
        );
      })}
    </ul>
  );
}
