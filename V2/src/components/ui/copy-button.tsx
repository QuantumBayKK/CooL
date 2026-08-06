"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Copy to clipboard.
 *
 * The confirmation is a glyph swap and a text change, not a toast. A toast for
 * an action whose result is already visible at the point of interaction is
 * noise, and it moves the reader's eye away from what they were doing.
 *
 * The timer is cleared on unmount: a 1.6s timeout that fires after the
 * component is gone sets state on a dead component, which in a page of many
 * code blocks is a steady drip of warnings.
 */
export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access is denied in some embedded contexts. Failing silently
      // is correct here — the text is on screen and selectable either way, and
      // an error dialog for a convenience affordance is worse than no feedback.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[--radius-xs] px-1.5 py-1",
        "font-mono text-[0.6875rem] uppercase tracking-[0.08em]",
        "transition-colors duration-[--duration-state] ease-[--ease-out]",
        copied ? "text-ok" : "text-ink-subtle hover:text-ink",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3" strokeWidth={2.5} aria-hidden />
      ) : (
        <Copy className="size-3" strokeWidth={2} aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
      {/* Announced to screen readers only when it changes, so the button's own
          label stays stable for anyone navigating by control. */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
