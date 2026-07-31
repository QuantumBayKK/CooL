"use client";

import { useState } from "react";
import clsx from "clsx";
import { Station, Reveal, Glass } from "@/components/ui";
import ConceptStage from "@/components/ConceptStage";

const DOMAINS = [
  { id: "hw", icon: "▣", name: "Hardware", d: "TEE enclaves — Phala, NVIDIA CC, Nitro, TDX" },
  { id: "sw", icon: "⌘", name: "Software", d: "Open SDK + independent offline verifier" },
  { id: "crypto", icon: "🔑", name: "Cryptography", d: "ML-DSA signatures, ML-KEM channels, SHA-256" },
  { id: "chain", icon: "⛓", name: "Blockchain", d: "Append-only Merkle log anchored to Base L2" },
];

const THREATS = [
  { who: "Attacker", move: "edits a receipt", why: "hash mismatch — you just watched it happen ↑" },
  { who: "Cloud provider", move: "reads enclave memory", why: "hardware isolation (mock today, stated)" },
  { who: "Operator (us)", move: "forges or rewrites the log", why: "append-only Merkle history, public roots" },
  { who: "Quantum computer", move: "breaks RSA / EC", why: "ML-DSA + ML-KEM are post-quantum" },
];

export default function TrustDomains() {
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setBroken((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const n = broken.size;
  const survives = n < 4;

  return (
    <Station
      id="trust"
      layer="02 · THE ENGINEER"
      station="§12+§20 · Trust domains"
      title={
        <>
          Break one. <span className="text-verify">The system survives.</span>
        </>
      }
      sub="Four independent trust domains back every receipt. Tap a domain to compromise it and watch the survival state recompute."
    >
      <ConceptStage
        model="enclave"
        sectionId="trust"
        finish="graphite"
        caption="the sealed enclave"
      />
      <div className="grid grid-cols-2 gap-3">
        {DOMAINS.map((d) => {
          const isBroken = broken.has(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggle(d.id)}
              aria-pressed={isBroken}
              className={clsx(
                "rounded-2xl border p-4 text-left transition-all duration-300",
                isBroken
                  ? "border-fail/50 bg-fail/10 opacity-90"
                  : "glass hover:border-verify/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg" aria-hidden>
                  {d.icon}
                </span>
                <span
                  className={clsx(
                    "font-mono text-[10px] tracking-wide uppercase",
                    isBroken ? "text-fail" : "text-live",
                  )}
                >
                  {isBroken ? "✕ broken" : "✓ intact"}
                </span>
              </div>
              <p className={clsx("mt-2 font-mono text-sm", isBroken ? "text-fail line-through" : "text-white")}>
                {d.name}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-mist">{d.d}</p>
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className={clsx(
          "mt-4 rounded-2xl border px-4 py-4 transition-colors duration-300",
          survives ? "border-live/40 bg-live/5" : "border-fail/50 bg-fail/10",
        )}
      >
        {survives ? (
          <>
            <p className="display text-xl text-live">
              {n === 0 ? "4/4 domains intact" : `System survives — ${4 - n}/4 intact`}
            </p>
            <p className="mt-1 text-sm text-mist">
              {n === 0
                ? "No single domain is trusted alone. That independence is the product."
                : "Receipts remain verifiable through the remaining domains. No single point of trust, no single point of failure."}
            </p>
          </>
        ) : (
          <>
            <p className="display text-xl text-fail">Full collapse — 0/4</p>
            <p className="mt-1 text-sm text-mist">
              An attacker must break hardware, software, cryptography and the
              chain — <span className="text-fog">simultaneously</span>. That is
              the bar.
            </p>
          </>
        )}
      </div>

      {/* §20 threat model */}
      <Reveal delay={0.1}>
        <p className="mt-10 mb-3 font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
          §20 · Threat model — everyone who tries to cheat
        </p>
        <Glass className="divide-y divide-line overflow-hidden rounded-2xl">
          {THREATS.map((t) => (
            <div key={t.who} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] text-white">
                  {t.who}{" "}
                  <span className="text-mist">{t.move}</span>
                </p>
                <p className="mt-0.5 text-xs text-mist">{t.why}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-fail">→ fails</span>
            </div>
          ))}
        </Glass>
      </Reveal>
    </Station>
  );
}
