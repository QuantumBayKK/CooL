"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import clsx from "clsx";
import { Station, MonoTag } from "@/components/ui";
import ConceptStage from "@/components/ConceptStage";

const STAGES = [
  {
    t: "Prompt",
    d: "Your app calls cool.complete(). The request is hashed (SHA-256) before anything moves.",
  },
  {
    t: "PQC handshake",
    d: "Hybrid ML-KEM + classical key exchange opens a quantum-safe channel to the node.",
  },
  {
    t: "TEE execution",
    d: "The model runs inside a hardware enclave — the host and its cloud provider can't see in.",
    mock: true,
  },
  {
    t: "Attestation",
    d: "The enclave signs a quote: this code, these weights, this input.",
    mock: true,
  },
  {
    t: "Receipt",
    d: "Output + hashes + quote + timestamp become one receipt, signed with ML-DSA-65.",
  },
  {
    t: "Merkle log",
    d: "The receipt is appended to an append-only Merkle log. Each root commits to all history.",
  },
  {
    t: "On-chain anchor",
    d: "The root anchors to Base L2 — cents per transaction, Ethereum-grade permanence.",
    mock: true,
  },
  {
    t: "Verification",
    d: "Anyone can verify the receipt offline, without CooL existing. That's the point.",
  },
];

export default function Journey() {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.75", "end 0.45"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.floor(v * STAGES.length + 0.0001));
  });

  return (
    <Station
      id="journey"
      layer="02 · THE ENGINEER"
      station="§01+§03 · Inference journey"
      title="Follow one request through the machine."
      sub="Scroll drives the request — each stage lights as you pass it. Tap a stage to open it."
    >
      <ConceptStage
        model="system"
        sectionId="journey"
        finish="titanium"
        caption="the runtime, as one machine"
      />
      <div ref={railRef} className="relative">
        {/* the rail */}
        <div className="absolute top-2 bottom-2 left-[13px] w-px bg-line" aria-hidden />
        <motion.div
          className="absolute top-2 bottom-2 left-[13px] w-px origin-top bg-gradient-to-b from-verify to-verify-deep"
          style={{ scaleY: lineScale }}
          aria-hidden
        />

        <ol className="space-y-2.5">
          {STAGES.map((s, i) => {
            const lit = i <= active;
            const open = openIdx === i;
            return (
              <li key={s.t} className="relative pl-10">
                <span
                  className={clsx(
                    "absolute top-3.5 left-[7px] size-3.5 rounded-full border transition-all duration-500",
                    lit
                      ? "border-verify bg-verify shadow-[0_0_12px_rgba(88,166,255,0.8)]"
                      : "border-line bg-panel",
                  )}
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className={clsx(
                    "glass w-full rounded-xl px-4 py-3 text-left transition-opacity duration-500",
                    lit ? "opacity-100" : "opacity-45",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] text-verify/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-sm text-white">{s.t}</span>
                      {s.mock && <MonoTag tone="mock">mock</MonoTag>}
                    </span>
                    <span
                      className={clsx(
                        "font-mono text-xs text-mist transition-transform",
                        open && "rotate-90",
                      )}
                      aria-hidden
                    >
                      ▸
                    </span>
                  </div>
                  {open && (
                    <p className="mt-2 text-sm leading-relaxed text-mist">{s.d}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-5 font-mono text-[11px] leading-relaxed text-mist">
        <span className="text-mock">⚠ mock</span> = simulated today, stated
        honestly. See the build board ↓
      </p>
    </Station>
  );
}
