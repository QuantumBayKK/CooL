"use client";

/**
 * A syntax-highlighted code block for the console.
 *
 * Dark inside a light console on purpose: code is a quotation, and giving it a
 * different surface stops a reader mistaking a snippet for a control. It uses
 * the same tokeniser as the IDE, so a snippet here and the same file in the
 * editor are coloured identically.
 */
import { tokenize, TOKEN_COLOR } from "@/lib/studio/highlight";
import type { Lang } from "@/lib/studio/project";

export function CodeBlock({
  code,
  lang = "ts",
  title,
  maxHeight,
}: {
  code: string;
  lang?: Lang;
  title?: string;
  maxHeight?: number;
}) {
  const lines = tokenize(code.trimEnd(), lang);

  return (
    <div
      data-skin="vscode"
      className="overflow-hidden rounded-[3px] border"
      style={{ borderColor: "var(--atl-border-strong)", background: "var(--vsc-editor)" }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5"
        style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-chrome)" }}
      >
        <span className="font-mono text-[11.5px]" style={{ color: "var(--vsc-muted)" }}>
          {title ?? lang}
        </span>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(code)}
          className="rounded-[2px] px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ color: "var(--vsc-muted)", background: "rgba(255,255,255,0.06)" }}
        >
          Copy
        </button>
      </div>
      <pre
        className="thin-scroll overflow-auto px-3 py-2.5 font-mono text-[12px] leading-[1.65]"
        style={{ maxHeight }}
      >
        <code>
          {lines.map((tokens, index) => (
            <div key={index}>
              {tokens.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                tokens.map((token, i) => (
                  <span key={i} style={{ color: TOKEN_COLOR[token.kind] }}>
                    {token.text}
                  </span>
                ))
              )}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
