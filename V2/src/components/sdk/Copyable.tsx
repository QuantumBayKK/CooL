"use client";

/**
 * A code block with a copy button.
 *
 * The install commands on this page are the product's front door — the reader's
 * next action is always "copy this", so the copy affordance is on every block
 * rather than behind a hover.
 */
import { useState } from "react";

export default function Copyable({
  label,
  code,
  tone = "default",
}: {
  label?: string;
  code: string;
  tone?: "default" | "primary";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard permission denied — the text is selectable, so this is not
      // worth an error state.
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        tone === "primary" ? "border-verify/40 bg-verify/[0.06]" : "border-line bg-panel/60"
      }`}
    >
      {label && (
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          <span className="font-mono text-[11px] tracking-[0.1em] text-mist uppercase">{label}</span>
          <button
            type="button"
            onClick={() => void copy()}
            className="font-mono text-[11px] text-mist transition-colors hover:text-ink"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-[1.65] text-fog">
        <code>{code}</code>
      </pre>
      {!label && (
        <div className="flex justify-end border-t border-line px-3 py-1">
          <button
            type="button"
            onClick={() => void copy()}
            className="font-mono text-[11px] text-mist transition-colors hover:text-ink"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}
    </div>
  );
}
