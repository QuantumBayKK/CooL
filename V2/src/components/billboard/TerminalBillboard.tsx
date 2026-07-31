"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Cool, generateKeypair, verifyReceipt } from "@/lib/cool";
import type { Verdict } from "@/lib/cool/types";
import { prefersReduced } from "@/lib/motion";

/**
 * The billboard.
 *
 * The reference for this is the `npm i ai` board — black, monospace, one
 * command, no explanation. The reason that genre works is that it does not
 * advertise the product, it *shows* it, and the viewer's own recognition does
 * the selling.
 *
 * So this board does not animate a script of plausible-looking output. It mints
 * a real receipt with the vendored SDK, runs the real verifier over it, and
 * prints what actually came back — real key id, real digest, real per-domain
 * statuses, real elapsed milliseconds. The `MOCK` line for attestation is
 * printed for the same reason it is printed everywhere else on this site: it is
 * the true answer, and a board that lied here would undercut the one thing the
 * product sells.
 */

type Line = {
  /** Rendered text. */
  text: string;
  tone: "prompt" | "dim" | "pass" | "mock" | "fail" | "hero";
  /** Beat to hold after this line, in ms. */
  hold: number;
};

const TONE: Record<Line["tone"], string> = {
  prompt: "text-ink",
  dim: "text-mist",
  pass: "text-live",
  mock: "text-mock",
  fail: "text-fail",
  hero: "text-live",
};

const COMMAND = "npx @northwind/cool-verifier receipt.json";

/** Turn a real verdict into the board's output lines. */
function linesFor(verdict: Verdict, ms: number, digest: string): Line[] {
  const domain = (label: string, status: string): Line => {
    const tone =
      status === "pass" ? "pass" : status === "fail" ? "fail" : "mock";
    const word =
      status === "pass"
        ? "PASS"
        : status === "fail"
          ? "FAIL"
          : status === "mock"
            ? "MOCK"
            : "ABSENT";
    return { text: `${label.padEnd(14, " ")}${word}`, tone, hold: 110 };
  };

  return [
    { text: `receipt   ${digest}`, tone: "dim", hold: 180 },
    { text: `key       ${verdict.subject?.key_id ?? "—"}`, tone: "dim", hold: 240 },
    domain("binding", verdict.checks.binding.status),
    domain("signature", verdict.checks.signature.status),
    domain("inclusion", verdict.checks.inclusion.status),
    domain("attestation", verdict.checks.attestation.status),
    domain("anchor", verdict.checks.anchor.status),
    { text: "", tone: "dim", hold: 220 },
    {
      text: verdict.ok ? "VERIFIED OFFLINE" : "REJECTED",
      tone: verdict.ok ? "hero" : "fail",
      hold: 600,
    },
    {
      text: `ml-dsa-65 + ed25519 · ${ms} ms · no network`,
      tone: "dim",
      hold: 2600,
    },
  ];
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function TerminalBillboard() {
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const play = useCallback(async () => {
    if (!alive.current) return;
    setRunning(true);
    setTyped("");
    setLines([]);

    const reduced = prefersReduced();

    // ---- type the command ----
    if (reduced) {
      setTyped(COMMAND);
    } else {
      for (let i = 1; i <= COMMAND.length; i++) {
        if (!alive.current) return;
        setTyped(COMMAND.slice(0, i));
        // slightly irregular, the way a person types
        await sleep(i % 7 === 0 ? 58 : 32);
      }
    }
    if (!alive.current) return;
    await sleep(reduced ? 100 : 420);

    // ---- do the real work ----
    const signing = generateKeypair("northwind-prod-01");
    const cool = new Cool({
      signing,
      log: "memory",
      logId: "northwind",
      provider: "customer-vpc",
      backend: ({ prompt }) => ({ output: `sealed:${prompt.length}` }),
    });
    const { receipt } = await cool.complete({
      model: "acme/credit-scorer@2026.07.1",
      prompt: "Return approve or decline, with the top three factors.",
      params: { temperature: 0 },
    });

    const t0 = performance.now();
    const verdict = await verifyReceipt(receipt);
    const ms = Math.max(1, Math.round(performance.now() - t0));

    if (!alive.current) return;

    const digest = receipt.binding_hash.replace("mh:sha256:", "").slice(0, 16) + "…";
    const out = linesFor(verdict, ms, digest);

    // ---- stream it ----
    for (const line of out) {
      if (!alive.current) return;
      setLines((prev) => [...prev, line]);
      await sleep(reduced ? 0 : line.hold);
    }

    if (!alive.current) return;
    setRunning(false);
  }, []);

  useEffect(() => {
    void play();
  }, [play, cycle]);

  return (
    <div className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-black px-6 py-16 sm:px-10">
      {/* the faint pool of light a real board sits in */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(88,166,255,0.10), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-4xl">
        {/* the command */}
        <p className="font-mono text-[clamp(1.05rem,4.6vw,2.6rem)] leading-tight text-ink">
          <span className="text-verify">$ </span>
          <span className="break-all">{typed}</span>
          <span
            className={clsx(
              "ml-0.5 inline-block w-[0.5em] translate-y-[0.08em] bg-ink align-middle",
              "h-[0.95em]",
              typed.length === COMMAND.length && !running
                ? "animate-pulse"
                : "animate-pulse",
            )}
            aria-hidden
          />
        </p>

        {/* the real output */}
        <div className="mt-[clamp(1rem,3vw,2rem)] space-y-[0.35em]">
          {lines.map((l, i) => (
            <p
              key={`${cycle}-${i}`}
              className={clsx(
                "font-mono leading-tight",
                l.tone === "hero"
                  ? "text-[clamp(1.5rem,7vw,4rem)] font-semibold tracking-tight"
                  : "text-[clamp(0.82rem,3.2vw,1.65rem)]",
                TONE[l.tone],
              )}
              style={{ whiteSpace: "pre" }}
            >
              {l.text || " "}
            </p>
          ))}
        </div>

        {/* the mark — bottom right, the way a board signs itself */}
        <div className="mt-[clamp(2rem,6vw,4rem)] flex items-end justify-between gap-4">
          <button
            type="button"
            onClick={() => setCycle((c) => c + 1)}
            disabled={running}
            className="font-mono text-[11px] tracking-[0.18em] text-mist uppercase transition-colors hover:text-ink disabled:opacity-40"
          >
            {running ? "running…" : "run it again"}
          </button>

          <div className="flex items-baseline gap-2">
            <span className="display text-[clamp(1.6rem,5vw,2.6rem)] leading-none text-ink">
              CooL
            </span>
            <span className="inline-block size-2 bg-verify" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
