"use client";

/**
 * The integrated terminal.
 *
 * It is wired to the live SDK session rather than to a script: `cool verify`
 * really runs the verifier over a real receipt, `cool seal` really signs one
 * inside the enclave, and the timings printed are the ones just measured. A
 * terminal that prints a canned transcript is a video; this one is the product
 * with a prompt in front of it.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

export type TermTone = "out" | "ok" | "err" | "warn" | "dim" | "cmd" | "accent";

export interface TermLine {
  readonly text: string;
  readonly tone?: TermTone;
}

export type Printer = (line: TermLine | string) => void;

const TONE: Record<TermTone, string> = {
  out: "var(--vsc-text)",
  ok: "var(--vsc-term-green)",
  err: "var(--vsc-term-red)",
  warn: "var(--vsc-term-yellow)",
  dim: "var(--vsc-dim)",
  cmd: "var(--vsc-bright)",
  accent: "var(--vsc-term-cyan)",
};

/** Imperative handle, so the Run button can drive the same prompt a user types at. */
export interface TerminalApi {
  submit(command: string): Promise<void>;
}

export function Terminal({
  greeting,
  onRun,
  cwd = "~/refund-agent",
  onReady,
}: {
  greeting: readonly TermLine[];
  onRun: (command: string, print: Printer) => Promise<void>;
  cwd?: string;
  onReady?: (api: TerminalApi) => void;
}) {
  const [lines, setLines] = useState<TermLine[]>([...greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const runCommand = useCallback(
    async (raw: string) => {
      const command = raw.trim();
      if (!command) return;
      setHistory((prev) => [command, ...prev]);
      setCursor(-1);
      setLines((prev) => [...prev, { text: `${cwd} $ ${command}`, tone: "cmd" }]);
      if (command === "clear") {
        setLines([]);
        return;
      }
      setBusy(true);
      try {
        await onRun(command, (line) =>
          setLines((prev) => [...prev, typeof line === "string" ? { text: line } : line]),
        );
      } catch (error) {
        setLines((prev) => [...prev, { text: `error: ${(error as Error).message}`, tone: "err" }]);
      }
      setBusy(false);
    },
    [cwd, onRun],
  );

  // Registered once: the Run button and the launch configs drive the same prompt.
  const runRef = useRef(runCommand);
  runRef.current = runCommand;
  useEffect(() => {
    onReady?.({ submit: (command) => runRef.current(command) });
  }, [onReady]);

  const submit = async () => {
    const command = input;
    setInput("");
    await runCommand(command);
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      void submit();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next >= 0) {
        setCursor(next);
        setInput(history[next] ?? "");
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setInput(next < 0 ? "" : (history[next] ?? ""));
    }
  };

  return (
    <div
      className="thin-scroll h-full overflow-auto px-3 py-2 font-mono text-[12px] leading-[1.6]"
      style={{ background: "var(--vsc-chrome)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line, index) => (
        <div key={index} style={{ color: TONE[line.tone ?? "out"] }} className="break-words whitespace-pre-wrap">
          {line.text || " "}
        </div>
      ))}

      <div className="flex items-center gap-1.5">
        <span style={{ color: "var(--vsc-term-green)" }}>{cwd}</span>
        <span style={{ color: "var(--vsc-term-blue)" }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKey}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-[12px] outline-none disabled:opacity-60"
          style={{ color: "var(--vsc-bright)" }}
          aria-label="Terminal input"
        />
        {busy && <span className="studio-caret" style={{ color: "var(--vsc-muted)" }}>▍</span>}
      </div>
      <div ref={endRef} />
    </div>
  );
}
