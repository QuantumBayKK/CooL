"use client";

/**
 * Act one — the editor.
 *
 * The whole argument of the product is made here, by omission: the engineer
 * changes one line and saves. There is no form, no ticket, no checklist and no
 * CooL UI in this act at all. Whatever the rest of the demo shows has to have
 * come from this keystroke, or it does not count.
 *
 * Two ways to drive it, because both audiences exist. A presenter can type into
 * the file like anyone would; or press "Make the change" and the edit is typed
 * out at reading speed, which keeps a timed demo on rails and lets the person
 * running it watch the room instead of the keyboard.
 *
 * The other two files in the tree are the honest answer to "what did you have
 * to write to get this?" — a config object and a six-line hook. They are open
 * to be read, and they are not editable, which the editor says rather than
 * silently swallowing keystrokes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, FileCode2, FileText, Save } from "lucide-react";
import { Editor } from "@/components/studio/ide/Editor";
import { lineDiff } from "@/lib/cool/phala";
import {
  ENGINEER,
  PROMPT_AFTER,
  PROMPT_BEFORE,
  PROMPT_PATH,
  REPO,
  TREE,
} from "@/lib/story/script";
import { Button } from "./ui";

/** Type speed for the scripted edit. Fast enough to hold a room, slow enough to read. */
const TYPE_MS = 26;

export function EditorScene({
  onSave,
  saved,
}: {
  onSave: (next: string) => void;
  saved: boolean;
}) {
  const [open, setOpen] = useState(PROMPT_PATH);
  const [body, setBody] = useState(PROMPT_BEFORE);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [typing, setTyping] = useState(false);
  const timers = useRef<number[]>([]);

  const file = TREE.find((f) => f.path === open) ?? TREE[0]!;
  const dirty = open === PROMPT_PATH && body !== PROMPT_BEFORE && !saved;

  // The changed line, computed rather than hard-coded, so editing the script
  // never leaves the status bar describing an edit that is no longer there.
  const changed = useMemo(() => {
    const diff = lineDiff(PROMPT_BEFORE, body);
    return {
      added: diff.filter((d) => d.kind === "added").length,
      removed: diff.filter((d) => d.kind === "removed").length,
    };
  }, [body]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /** Type the scripted edit: select line one, then replace it character by character. */
  const autoEdit = useCallback(() => {
    if (typing || saved) return;
    setOpen(PROMPT_PATH);
    setTyping(true);

    const beforeFirst = PROMPT_BEFORE.indexOf("\n");
    const afterFirst = PROMPT_AFTER.indexOf("\n");
    const tail = PROMPT_BEFORE.slice(beforeFirst);
    const target = PROMPT_AFTER.slice(0, afterFirst);
    const common = "You are a banking ";

    // Delete back to the shared prefix, then type the new ending. That is what
    // a person actually does to this line, and it reads as an edit rather than
    // a paste.
    const deletions: string[] = [];
    for (let i = PROMPT_BEFORE.slice(0, beforeFirst).length; i > common.length; i--) {
      deletions.push(PROMPT_BEFORE.slice(0, i - 1) + tail);
    }
    const additions: string[] = [];
    for (let i = common.length + 1; i <= target.length; i++) {
      additions.push(target.slice(0, i) + tail);
    }

    const frames = [...deletions, ...additions];
    frames.forEach((frame, index) => {
      timers.current.push(
        window.setTimeout(
          () => {
            setBody(frame);
            if (index === frames.length - 1) setTyping(false);
          },
          (index + 1) * TYPE_MS,
        ),
      );
    });
  }, [typing, saved]);

  const save = useCallback(() => {
    if (open !== PROMPT_PATH || saved) return;
    onSave(body);
  }, [body, onSave, open, saved]);

  return (
    <div
      data-skin="vscode"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-editor)" }}
    >
      {/* title bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
        style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-chrome)" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-[11px] rounded-full" style={{ background: "#ff5f57" }} />
            <span className="size-[11px] rounded-full" style={{ background: "#febc2e" }} />
            <span className="size-[11px] rounded-full" style={{ background: "#28c840" }} />
          </span>
        </div>
        <div className="text-[11.5px]" style={{ color: "var(--vsc-muted)" }}>
          {file.path.split("/").pop()} — {REPO.name}
        </div>
        <div className="w-14" />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* explorer */}
        <div
          className="hidden w-52 shrink-0 flex-col border-r sm:flex"
          style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-chrome)" }}
        >
          <div
            className="px-4 py-2 text-[10.5px] tracking-[0.12em] uppercase"
            style={{ color: "var(--vsc-muted)" }}
          >
            Explorer
          </div>
          <div className="px-2 pb-2">
            <div
              className="flex items-center gap-1 px-2 py-1 text-[11.5px] font-semibold"
              style={{ color: "var(--vsc-bright)" }}
            >
              <ChevronRight size={13} className="rotate-90" />
              {REPO.name}
            </div>
            {TREE.map((entry) => {
              const active = entry.path === open;
              const name = entry.path.split("/").pop()!;
              const Icon = entry.editable ? FileText : FileCode2;
              return (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => setOpen(entry.path)}
                  className="flex w-full items-center gap-1.5 rounded-[3px] py-[3px] pr-2 pl-6 text-left text-[12px]"
                  style={{
                    background: active ? "var(--vsc-hover)" : "transparent",
                    color: active ? "var(--vsc-bright)" : "var(--vsc-text)",
                  }}
                >
                  <Icon size={13} style={{ color: entry.editable ? "#519aba" : "#e8c07d" }} />
                  <span className="truncate">{name}</span>
                  {entry.path === PROMPT_PATH && dirty && (
                    <span
                      className="ml-auto size-[7px] shrink-0 rounded-full"
                      style={{ background: "var(--vsc-bright)" }}
                      aria-label="unsaved"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-3">
            <Button
              tone={saved ? "ghost" : "primary"}
              size="sm"
              onClick={autoEdit}
              disabled={typing || saved || body !== PROMPT_BEFORE}
            >
              {saved ? "Change committed" : typing ? "Typing…" : "Make the change"}
            </Button>
          </div>
        </div>

        {/* editor column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* tabs */}
          <div
            className="flex shrink-0 items-stretch border-b"
            style={{ borderColor: "var(--vsc-border)", background: "var(--vsc-chrome)" }}
          >
            {TREE.map((entry) => {
              const active = entry.path === open;
              const name = entry.path.split("/").pop()!;
              return (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => setOpen(entry.path)}
                  className="flex items-center gap-2 border-r px-3 py-1.5 text-[12px]"
                  style={{
                    borderColor: "var(--vsc-border)",
                    background: active ? "var(--vsc-editor)" : "transparent",
                    color: active ? "var(--vsc-bright)" : "var(--vsc-muted)",
                    borderTop: active
                      ? "1px solid var(--vsc-accent)"
                      : "1px solid transparent",
                  }}
                >
                  <span className="truncate">{name}</span>
                  {entry.path === PROMPT_PATH && dirty && (
                    <span
                      className="size-[7px] rounded-full"
                      style={{ background: "var(--vsc-bright)" }}
                      aria-label="unsaved"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* breadcrumb */}
          <div
            className="flex shrink-0 items-center gap-1 px-4 py-1 text-[11px]"
            style={{ color: "var(--vsc-dim)", background: "var(--vsc-editor)" }}
          >
            {file.path.split("/").map((part, index, all) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight size={11} />}
                <span style={{ color: index === all.length - 1 ? "var(--vsc-muted)" : undefined }}>
                  {part}
                </span>
              </span>
            ))}
          </div>

          {file.editable ? (
            <Editor
              path={file.path}
              lang={file.lang}
              value={body}
              onChange={saved ? () => {} : setBody}
              onSave={save}
              onCursor={setCursor}
              {...(saved ? { readOnlyNote: "committed — the record is sealed" } : {})}
            />
          ) : (
            <Editor
              path={file.path}
              lang={file.lang}
              value={file.body}
              onChange={() => {}}
              onSave={() => {}}
              onCursor={setCursor}
              readOnlyNote="read-only — this is the integration, not the demo"
            />
          )}

          {/* status bar */}
          <div
            className="flex shrink-0 items-center justify-between px-3 py-1 text-[11px]"
            style={{ background: "var(--vsc-accent)", color: "#fff" }}
          >
            <div className="flex items-center gap-3">
              <span>⎇ {REPO.branch}</span>
              <span className="hidden sm:inline">
                {ENGINEER.handle}@{REPO.name}
              </span>
              {changed.added > 0 && (
                <span>
                  +{changed.added} −{changed.removed}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>
                Ln {cursor.line}, Col {cursor.column}
              </span>
              {open === PROMPT_PATH &&
                (saved ? (
                  <span className="flex items-center gap-1">
                    <Check size={12} /> Saved
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={save}
                    disabled={!dirty}
                    className="flex items-center gap-1 rounded px-1.5 py-[1px] disabled:opacity-55"
                    style={{ background: dirty ? "rgba(255,255,255,0.22)" : "transparent" }}
                  >
                    <Save size={12} /> {dirty ? "Save  ⌘S" : "No changes"}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
