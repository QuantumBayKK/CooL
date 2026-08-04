"use client";

/**
 * The editor pane — a real one.
 *
 * Text is edited in a transparent `<textarea>` layered exactly over a
 * highlighted `<pre>`: the browser handles the caret, selection, IME, undo and
 * accessibility, and we only paint colour behind it. That is the technique every
 * lightweight code editor uses before it reaches for a full editing engine, and
 * it costs a few hundred bytes instead of a few hundred kilobytes.
 *
 * The two layers must agree on metrics to the pixel — same font, same size, same
 * line-height, same padding — so those values live in one constant rather than
 * being repeated and drifting.
 */
import { useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type UIEvent } from "react";
import { tokenize, TOKEN_COLOR } from "@/lib/studio/highlight";
import type { Lang } from "@/lib/studio/project";

const METRICS = {
  fontFamily: "var(--font-mono)",
  fontSize: "12.5px",
  lineHeight: "19px",
  padding: "8px 32px 120px 0",
  tabSize: 2,
} as const;

const GUTTER = 52;

export function Editor({
  path,
  lang,
  value,
  onChange,
  onSave,
  onCursor,
  readOnlyNote,
}: {
  path: string;
  lang: Lang;
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  onCursor: (position: { line: number; column: number }) => void;
  readOnlyNote?: string;
}) {
  const lines = useMemo(() => tokenize(value, lang), [value, lang]);
  const [active, setActive] = useState(1);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const areaRef = useRef<HTMLTextAreaElement>(null);

  /** Derive the caret's line/column from the raw selection offset. */
  const trackCaret = () => {
    const area = areaRef.current;
    if (!area) return;
    const upto = value.slice(0, area.selectionStart);
    const line = upto.split("\n").length;
    const column = upto.length - upto.lastIndexOf("\n");
    setActive(line);
    onCursor({ line, column });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const area = areaRef.current;
    if (!area) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSave();
      return;
    }

    // Tab indents rather than leaving the editor. Shift+Tab outdents.
    if (event.key === "Tab") {
      event.preventDefault();
      const { selectionStart, selectionEnd } = area;
      if (event.shiftKey) {
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === "  ") {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange(next);
          queueMicrotask(() => area.setSelectionRange(selectionStart - 2, selectionEnd - 2));
        }
        return;
      }
      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      onChange(next);
      queueMicrotask(() => area.setSelectionRange(selectionStart + 2, selectionStart + 2));
      return;
    }

    // Keep the indentation of the line you are leaving.
    if (event.key === "Enter") {
      const { selectionStart } = area;
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const indent = /^[ \t]*/.exec(value.slice(lineStart, selectionStart))?.[0] ?? "";
      if (indent.length > 0) {
        event.preventDefault();
        const insert = `\n${indent}`;
        const next = value.slice(0, selectionStart) + insert + value.slice(area.selectionEnd);
        onChange(next);
        queueMicrotask(() => {
          const at = selectionStart + insert.length;
          area.setSelectionRange(at, at);
          trackCaret();
        });
      }
    }
  };

  const onScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    setScroll({
      top: event.currentTarget.scrollTop,
      left: event.currentTarget.scrollLeft,
    });
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
    queueMicrotask(trackCaret);
  };

  return (
    <div className="relative flex min-h-0 flex-1" style={{ background: "var(--vsc-editor)" }}>
      {/* gutter */}
      <div
        className="relative shrink-0 overflow-hidden select-none"
        style={{ width: GUTTER, background: "var(--vsc-editor)" }}
        aria-hidden
      >
        <div
          style={{
            transform: `translateY(${-scroll.top}px)`,
            paddingTop: 8,
            fontFamily: METRICS.fontFamily,
            fontSize: METRICS.fontSize,
            lineHeight: METRICS.lineHeight,
          }}
        >
          {lines.map((_, index) => (
            <div
              key={index}
              className="pr-3 text-right"
              style={{ color: index + 1 === active ? "var(--vsc-bright)" : "var(--vsc-dim)" }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* text + paint */}
      <div className="relative min-w-0 flex-1">
        {/* The paint layer clips at the pane's edges and scrolls its CONTENT.
            Translating the box itself would carry its clipping region along with
            it and spill highlighted text over the tab bar. */}
        <pre
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre"
          style={{
            fontFamily: METRICS.fontFamily,
            fontSize: METRICS.fontSize,
            lineHeight: METRICS.lineHeight,
            tabSize: METRICS.tabSize,
          }}
        >
          <code
            className="block"
            style={{
              padding: METRICS.padding,
              transform: `translate(${-scroll.left}px, ${-scroll.top}px)`,
              willChange: "transform",
            }}
          >
            {lines.map((tokens, index) => (
              <div
                key={index}
                style={{
                  background: index + 1 === active ? "var(--vsc-line-highlight)" : "transparent",
                  minHeight: METRICS.lineHeight,
                }}
              >
                {tokens.length === 0 ? (
                  <span> </span>
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

        <textarea
          ref={areaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onScroll={onScroll}
          onClick={trackCaret}
          onKeyUp={trackCaret}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label={`${path} — editable`}
          className="thin-scroll absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent whitespace-pre outline-none"
          style={{
            fontFamily: METRICS.fontFamily,
            fontSize: METRICS.fontSize,
            lineHeight: METRICS.lineHeight,
            padding: METRICS.padding,
            tabSize: METRICS.tabSize,
            color: "transparent",
            caretColor: "var(--vsc-bright)",
          }}
        />

        {readOnlyNote && (
          <div
            className="pointer-events-none absolute right-4 bottom-3 rounded-[3px] px-2 py-1 text-[11px]"
            style={{ background: "rgba(0,0,0,0.55)", color: "var(--vsc-dim)" }}
          >
            {readOnlyNote}
          </div>
        )}
      </div>

      {/* minimap */}
      <div
        className="hidden w-[62px] shrink-0 overflow-hidden py-2 lg:block"
        style={{ background: "var(--vsc-editor)" }}
        aria-hidden
      >
        {lines.slice(0, 300).map((tokens, index) => (
          <div key={index} className="flex h-[3px] items-center gap-[1px] px-1">
            {tokens.slice(0, 14).map((token, i) => (
              <span
                key={i}
                style={{
                  width: Math.min(18, Math.max(1, token.text.trim().length)),
                  height: 2,
                  background: TOKEN_COLOR[token.kind],
                  opacity: token.kind === "plain" ? 0.25 : 0.55,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
