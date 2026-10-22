"use client";

import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the command is still visible to select */
    }
  };
  return (
    <button type="button" className="f-cmd" onClick={copy} data-impact="small" aria-label={`Copy command: ${command}`}>
      <span className="f-cmd__sigil" aria-hidden="true">
        $
      </span>
      <span>{command}</span>
      <span className="f-label" aria-live="polite">
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
