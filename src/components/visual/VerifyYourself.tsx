"use client";

import { useEffect, useRef, useState } from "react";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { cn } from "@/lib/cn";

const STEPS = [
  "Hardware attestation (TEE)",
  "Post-quantum signature",
  "Inclusion proof + witnesses",
  "Public anchor",
] as const;

/**
 * The single highest-trust interaction (Story Bible Ch.7): the user runs a (simplified)
 * verification and watches it pass — independently, visibly, without "trust us."
 */
export function VerifyYourself() {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [done, setDone] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  const run = () => {
    setStatus("running");
    setDone(0);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setDone((d) => {
        const next = d + 1;
        if (next >= STEPS.length) {
          if (timer.current) window.clearInterval(timer.current);
          setStatus("done");
          audioEngine.cue("verified");
        }
        return next;
      });
    }, 650);
  };

  const reset = () => {
    if (timer.current) window.clearInterval(timer.current);
    setStatus("idle");
    setDone(0);
  };

  return (
    <div className="w-[min(92vw,28rem)] rounded-xl border border-white/10 bg-void-raised/80 p-7 backdrop-blur-sm">
      <ul className="flex flex-col gap-3" aria-live="polite">
        {STEPS.map((step, i) => {
          const complete = i < done;
          const checking = status === "running" && i === done;
          return (
            <li key={step} className="flex items-center justify-between gap-4">
              <span
                className={cn(
                  "text-body transition-colors duration-300",
                  complete ? "text-paper" : "text-mist",
                )}
              >
                {step}
              </span>
              <span
                className={cn(
                  "font-instrument text-caption uppercase tracking-[0.18em] transition-colors duration-300",
                  complete ? "text-proof" : checking ? "text-verify" : "text-mist/40",
                )}
              >
                {complete ? "verified" : checking ? "checking…" : "—"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-7 flex items-center justify-between">
        {status === "done" ? (
          <span className="text-caption uppercase tracking-[0.22em] text-proof">
            Verified offline. No trust in CooL.
          </span>
        ) : (
          <span className="text-caption uppercase tracking-[0.22em] text-mist">
            Runs in your browser.
          </span>
        )}

        <button
          type="button"
          onClick={status === "done" ? reset : run}
          disabled={status === "running"}
          className="pointer-events-auto rounded-full border border-verify/40 px-5 py-2 text-caption uppercase tracking-[0.22em] text-verify transition-colors hover:bg-verify/10 focus-visible:bg-verify/10 focus-visible:outline-none disabled:opacity-50"
        >
          {status === "done" ? "Again" : status === "running" ? "Verifying…" : "Verify this proof"}
        </button>
      </div>
    </div>
  );
}
