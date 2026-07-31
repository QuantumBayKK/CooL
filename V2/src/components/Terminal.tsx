"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { RotateCcw } from "lucide-react";
import { prefersReduced } from "@/lib/motion";

/**
 * A terminal that types real commands.
 *
 * This exists because a developer does not believe a diagram. They believe a
 * shell. The commands below are the ones they would actually run, in the order
 * they would actually run them, and the output is shaped like output — prefixed,
 * aligned, with the timings and hashes in the places tools really put them.
 *
 * It only starts once scrolled into view, and it stops on unmount, so a deck
 * with several of these never has more than the visible one running.
 */

export type TermLine =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string; tone?: Tone }
  | { kind: "gap" };

type Tone = "dim" | "ok" | "warn" | "accent" | "plain";

const TONE: Record<Tone, string> = {
  dim: "text-mist",
  ok: "text-live",
  warn: "text-[#d29922]",
  accent: "text-verify",
  plain: "text-fog",
};

/** Rendered state of one line as it streams in. */
interface Rendered {
  kind: TermLine["kind"];
  text: string;
  tone: Tone;
  /** true while a command is still being typed */
  typing: boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Terminal({
  lines,
  title = "zsh",
  className,
  /** Per-character typing speed for commands. */
  typeMs = 26,
  /** Pause between output lines. */
  outMs = 90,
  replayable = true,
}: {
  lines: readonly TermLine[];
  title?: string;
  className?: string;
  typeMs?: number;
  outMs?: number;
  replayable?: boolean;
}) {
  const [rendered, setRendered] = useState<Rendered[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const runId = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const play = useCallback(async () => {
    const id = ++runId.current;
    const mine = () => alive.current && runId.current === id;

    setRunning(true);
    setDone(false);
    setRendered([]);

    if (prefersReduced()) {
      setRendered(
        lines.map((l) => ({
          kind: l.kind,
          text: l.kind === "gap" ? "" : l.text,
          tone: l.kind === "out" ? (l.tone ?? "plain") : "plain",
          typing: false,
        })),
      );
      setRunning(false);
      setDone(true);
      return;
    }

    for (const line of lines) {
      if (!mine()) return;

      if (line.kind === "gap") {
        setRendered((p) => [...p, { kind: "gap", text: "", tone: "plain", typing: false }]);
        await sleep(120);
        continue;
      }

      if (line.kind === "out") {
        setRendered((p) => [
          ...p,
          { kind: "out", text: line.text, tone: line.tone ?? "plain", typing: false },
        ]);
        await sleep(outMs);
        continue;
      }

      // a command types character by character
      setRendered((p) => [...p, { kind: "cmd", text: "", tone: "plain", typing: true }]);
      for (let i = 1; i <= line.text.length; i++) {
        if (!mine()) return;
        setRendered((p) => {
          const next = [...p];
          next[next.length - 1] = {
            kind: "cmd",
            text: line.text.slice(0, i),
            tone: "plain",
            typing: true,
          };
          return next;
        });
        // vary slightly so it reads as hands, not a metronome
        await sleep(i % 6 === 0 ? typeMs * 1.7 : typeMs);
      }
      if (!mine()) return;
      setRendered((p) => {
        const next = [...p];
        next[next.length - 1] = { ...next[next.length - 1]!, typing: false };
        return next;
      });
      await sleep(320);
    }

    if (!mine()) return;
    setRunning(false);
    setDone(true);
  }, [lines, typeMs, outMs]);

  /* Start only once the terminal is actually on screen. A deck holds several of
     these and starting them all on mount would burn frames on panels nobody is
     looking at — and the reader would arrive to a finished terminal, which
     defeats the point of typing it. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            io.disconnect();
            void play();
          }
        }
      },
      { rootMargin: "-15% 0px -15% 0px" },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [play]);

  // keep the newest line in view without scrolling the page
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rendered]);

  return (
    <div
      ref={hostRef}
      className={clsx(
        "overflow-hidden rounded-xl border border-line bg-[#0a0d12] shadow-[0_10px_40px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {/* chrome */}
      <div className="flex items-center gap-2 border-b border-line bg-panel/60 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1 font-mono text-[10.5px] text-mist">{title}</span>
        {replayable && done ? (
          <button
            type="button"
            onClick={() => void play()}
            className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] text-mist uppercase transition-colors hover:text-ink"
          >
            <RotateCcw className="size-3" /> replay
          </button>
        ) : null}
        {running ? (
          <span className="ml-auto font-mono text-[10px] tracking-[0.1em] text-live uppercase">
            running
          </span>
        ) : null}
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        className="max-h-[340px] overflow-y-auto px-3.5 py-3 font-mono text-[11.5px] leading-[1.65] sm:text-[12.5px]"
      >
        {rendered.map((l, i) => {
          if (l.kind === "gap") return <div key={i} className="h-2" />;
          if (l.kind === "cmd") {
            return (
              <p key={i} className="break-all text-ink">
                <span className="mr-1.5 select-none text-live">$</span>
                {l.text}
                {l.typing ? (
                  <span
                    className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] animate-pulse bg-ink align-middle"
                    aria-hidden
                  />
                ) : null}
              </p>
            );
          }
          return (
            <p key={i} className={clsx("break-all whitespace-pre-wrap", TONE[l.tone])}>
              {l.text}
            </p>
          );
        })}

        {/* resting cursor once everything has run */}
        {done ? (
          <p className="text-ink">
            <span className="mr-1.5 select-none text-live">$</span>
            <span
              className="inline-block h-[1em] w-[0.5em] translate-y-[0.12em] animate-pulse bg-ink align-middle"
              aria-hidden
            />
          </p>
        ) : null}
      </div>
    </div>
  );
}
