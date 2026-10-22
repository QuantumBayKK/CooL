"use client";

import { useId, useState } from "react";

/**
 * Tabbed code sample. Arrow keys move between tabs (WAI-ARIA tabs pattern);
 * the copy button copies the visible tab.
 */
export function CodeTabs({ tabs }: { tabs: readonly { label: string; file: string; code: string }[] }) {
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const id = useId();
  const tab = tabs[i] ?? tabs[0]!;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setI(n);
    document.getElementById(`${id}-tab-${n}`)?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the code is selectable */
    }
  };

  return (
    <div className="f-term">
      <div className="f-tabs" role="tablist" aria-label="Code samples" onKeyDown={onKey}>
        {tabs.map((t, n) => (
          <button
            key={t.label}
            id={`${id}-tab-${n}`}
            type="button"
            role="tab"
            className="f-tab"
            aria-selected={n === i}
            aria-controls={`${id}-panel`}
            tabIndex={n === i ? 0 : -1}
            onClick={() => setI(n)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="f-term__bar">
        <span>{tab.file}</span>
        <button
          type="button"
          onClick={copy}
          style={{ background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer" }}
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${i}`}
        className="f-term__body"
        style={{ margin: 0, minHeight: 0 }}
        tabIndex={0}
      >
        <code>{tab.code}</code>
      </pre>
    </div>
  );
}
