"use client";

/**
 * The demo, as a room you walk through.
 *
 * Eleven acts collapsed into seven stops, one on screen at a time, advanced by
 * a click or an arrow key. The constraint that shaped this file is that it has
 * to survive being run live, once, in front of someone who will interrupt:
 *
 *   - Every stop fits one screen. Nothing important is below a fold, because a
 *     presenter scrolling to find the point has already lost the room.
 *   - The rail is always visible and always clickable, so a question like "can
 *     I see the auditor view again" costs one click rather than a re-run.
 *   - Stops that need a sealed record are locked until one exists, and say why.
 *     A demo that can be clicked into an empty state will be.
 *   - A timer runs, because the whole thing is supposed to take seven minutes
 *     and the person running it should be able to see that it is.
 *
 * The boot happens while act one is on screen and act one does not need it, so
 * by the time anyone presses Save the enclave has been up for a minute.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, RotateCcw } from "lucide-react";
import type { CascadeResult } from "@/lib/story/cascade";
import { CHANGE_REF, PROMPT_BEFORE, PROMPT_PATH } from "@/lib/story/script";
import { StoryProvider, useStory } from "./session";
import { AuditorScene } from "./AuditorScene";
import { CascadeScene } from "./CascadeScene";
import { EditorScene } from "./EditorScene";
import { TeeScene } from "./TeeScene";
import { TimelineScene } from "./TimelineScene";
import { VerifierScene } from "./VerifierScene";
import { VerifyScene } from "./VerifyScene";
import { Button, Dot, Panel } from "./ui";

type ActId = "edit" | "cascade" | "verify" | "timeline" | "auditor" | "verifier" | "tee";

interface Act {
  readonly id: ActId;
  readonly n: string;
  readonly title: string;
  /** The one line a presenter says while this is on screen. */
  readonly line: string;
  /** Needs a sealed record to say anything true. */
  readonly needsRecord: boolean;
}

const ACTS: readonly Act[] = [
  {
    id: "edit",
    n: "01",
    title: "The change",
    line: "An engineer edits one line of a system prompt and saves. That is the entire user action in this demo.",
    needsRecord: false,
  },
  {
    id: "cascade",
    n: "02",
    title: "What happened by itself",
    line: "Nobody opened a ticket. The record, the policy decision, the evidence and the proof were produced by the save.",
    needsRecord: true,
  },
  {
    id: "verify",
    n: "03",
    title: "Verified offline",
    line: "The verifier runs with the network instrumented and counted. Take the file and check it yourself.",
    needsRecord: true,
  },
  {
    id: "timeline",
    n: "04",
    title: "The console",
    line: "Not a dashboard — a timeline where every row ends in a verdict you can re-run, or try to forge.",
    needsRecord: true,
  },
  {
    id: "auditor",
    n: "05",
    title: "The auditor's view",
    line: "The same records, pivoted onto obligations, counted from the receipts rather than typed in.",
    needsRecord: true,
  },
  {
    id: "verifier",
    n: "06",
    title: "Someone else's file",
    line: "Drop in a receipt this page never made. Edit a character first and watch it get caught.",
    needsRecord: false,
  },
  {
    id: "tee",
    n: "07",
    title: "Where it runs",
    line: "Measurement-sealed keys, RA-TLS, and the one object that separates this laptop from a real CVM.",
    needsRecord: true,
  },
];

/* ── the shell ────────────────────────────────────────────────────────── */

export default function StoryShell() {
  return (
    <StoryProvider>
      <Stage />
    </StoryProvider>
  );
}

function Stage() {
  const { ready, booting, seal, rows } = useStory();
  const [act, setAct] = useState<ActId>("edit");
  const [cascade, setCascade] = useState<CascadeResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [sealing, setSealing] = useState(false);
  const [replay, setReplay] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const index = ACTS.findIndex((a) => a.id === act);
  const current = ACTS[index]!;
  const unlocked = cascade !== null;

  /* the presenter's clock — starts at the first save, not at page load */
  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const go = useCallback(
    (next: ActId) => {
      const target = ACTS.find((a) => a.id === next);
      if (!target) return;
      if (target.needsRecord && !unlocked) return;
      setAct(next);
    },
    [unlocked],
  );

  /** The save that starts everything. */
  const onSave = useCallback(
    async (next: string) => {
      if (sealing || saved) return;
      setSealing(true);
      setSaved(true);
      setStartedAt((prev) => prev ?? Date.now());

      // A short, plausible commit id. Synthetic, and the cascade says so.
      const commit = Array.from({ length: 7 }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)],
      ).join("");

      const result = await seal({
        before: PROMPT_BEFORE,
        after: next,
        commit,
        path: PROMPT_PATH,
        ref: CHANGE_REF,
      });
      setSealing(false);
      if (result) {
        setCascade(result);
        setAct("cascade");
      }
    },
    [seal, sealing, saved],
  );

  /* ← → drive the deck, so a presenter never hunts for a button */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight") {
        const next = ACTS[index + 1];
        if (next) go(next.id);
      }
      if (event.key === "ArrowLeft") {
        const prev = ACTS[index - 1];
        if (prev) go(prev.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const clock = useMemo(() => {
    const total = Math.floor(elapsed / 1000);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }, [elapsed]);

  const nextAct = ACTS[index + 1];

  return (
    <div className="flex h-[100svh] flex-col overflow-hidden bg-void">
      {/* header */}
      <header className="shrink-0 border-b border-line px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 text-[12px] text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft size={13} /> CooL
          </Link>

          {/* the rail */}
          <nav className="thin-scroll -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1">
            {ACTS.map((a) => {
              const active = a.id === act;
              const locked = a.needsRecord && !unlocked;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => go(a.id)}
                  disabled={locked}
                  title={locked ? "seal a change first" : a.title}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor: active ? "var(--color-verify)" : "var(--color-line)",
                    background: active ? "rgba(88,166,255,0.1)" : "transparent",
                    color: active ? "var(--color-ink)" : "var(--color-mist)",
                  }}
                >
                  <span className="font-mono text-[10.5px] opacity-70">{a.n}</span>
                  <span className="hidden sm:inline">{a.title}</span>
                  {locked && <Lock size={10} />}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {startedAt !== null && (
              <span className="font-mono text-[12px] text-mist tabular-nums" title="since the save">
                {clock}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-[11.5px] text-mist">
              <Dot tone={ready ? "live" : "warn"} pulse={!ready} />
              <span className="hidden sm:inline">
                {ready ? "enclave up" : (booting ?? "booting")}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* the line the presenter is making */}
      <div className="shrink-0 border-b border-line bg-panel/40 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-baseline gap-3">
          <span className="shrink-0 font-mono text-[11px] tracking-[0.14em] text-mist uppercase">
            {current.n} · {current.title}
          </span>
          <span className="min-w-0 text-[12.5px] leading-snug text-fog">{current.line}</span>
        </div>
      </div>

      {/* the act */}
      <main className="min-h-0 flex-1 px-4 py-3 sm:px-6">
        <div className="mx-auto flex h-full max-w-[1500px] flex-col">
          {act === "edit" && <EditorScene onSave={(next) => void onSave(next)} saved={saved} />}

          {act === "cascade" &&
            (cascade ? (
              <CascadeScene
                steps={cascade.steps}
                replayKey={replay}
                onDone={() => {
                  /* the rail unlocks on its own; nothing to do here */
                }}
              />
            ) : (
              <Waiting sealing={sealing} />
            ))}

          {act === "verify" && cascade && <VerifyScene receipt={cascade.receipt} />}
          {act === "timeline" && <TimelineScene />}
          {act === "auditor" && <AuditorScene />}
          {act === "verifier" && <VerifierScene />}
          {act === "tee" && <TeeScene />}
        </div>
      </main>

      {/* footer */}
      <footer className="shrink-0 border-t border-line px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <span className="min-w-0 truncate text-[11.5px] text-mist">
            {rows.length} records sealed in this tab · every hash, signature and verdict computed
            here
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {act === "cascade" && cascade && (
              <Button size="sm" tone="ghost" onClick={() => setReplay((n) => n + 1)}>
                <RotateCcw size={12} /> Replay
              </Button>
            )}
            {nextAct && (
              <Button
                size="sm"
                tone="primary"
                onClick={() => go(nextAct.id)}
                disabled={nextAct.needsRecord && !unlocked}
              >
                {nextAct.title} <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Waiting({ sealing }: { sealing: boolean }) {
  return (
    <div className="grid h-full place-items-center">
      <Panel className="px-6 py-5 text-center">
        <div className="text-[13.5px] text-ink">
          {sealing ? "Sealing inside the enclave…" : "Nothing has changed yet"}
        </div>
        <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-mist">
          {sealing
            ? "Deriving the commitment, evaluating policy, signing with ML-DSA-65 and Ed25519, appending to the log."
            : "Go back to the editor, change the first line of the prompt, and save."}
        </p>
      </Panel>
    </div>
  );
}
