"use client";

import { Station, Reveal, MonoTag, type Tone } from "@/components/ui";
import clsx from "clsx";

const BOARDS: {
  tone: Tone;
  head: string;
  items: { t: string; d: string }[];
}[] = [
  {
    tone: "live",
    head: "✓ Real — shipped",
    items: [
      { t: "ML-DSA-65 signing", d: "Post-quantum signatures on every receipt" },
      { t: "SDK", d: "OpenAI-compatible, one-line integration" },
      { t: "Offline verifier", d: "The demo you just ran" },
      { t: "Merkle log", d: "Append-only, inclusion proofs" },
    ],
  },
  {
    tone: "mock",
    head: "⚠ Mock — stated honestly",
    items: [
      { t: "TEE attestation", d: "Simulated quote until Phala integration lands" },
      { t: "Base anchor", d: "Demo transactions, not mainnet" },
    ],
  },
  {
    tone: "mist",
    head: "◔ In progress",
    items: [
      { t: "Rust rewrite", d: "Orchestration layer" },
      { t: "Witness network", d: "Independent log witnesses" },
      { t: "NVIDIA CC", d: "GPU enclave backend" },
    ],
  },
];

const toneBorder: Record<string, string> = {
  live: "border-live/25",
  mock: "border-mock/30",
  mist: "border-line",
};

export default function Honesty() {
  return (
    <Station
      id="honesty"
      layer="03 · DUE DILIGENCE"
      station="§06+§19 · Build status"
      title="The dashboard most startups hide."
      sub="Mock vs real, in public. Honesty is the feature — a trust company that lies about its own build status has no product."
      wide
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {BOARDS.map((b, i) => (
          <Reveal key={b.head} delay={i * 0.08}>
            <div className={clsx("glass h-full rounded-2xl border p-4", toneBorder[b.tone])}>
              <MonoTag tone={b.tone}>{b.head}</MonoTag>
              <ul className="mt-4 space-y-3">
                {b.items.map((it) => (
                  <li key={it.t}>
                    <p className="font-mono text-[13px] text-white">{it.t}</p>
                    <p className="text-xs leading-snug text-mist">{it.d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Station>
  );
}
