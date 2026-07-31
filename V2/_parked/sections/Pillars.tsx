"use client";

import { motion } from "framer-motion";
import { Station, Reveal, MonoTag, FLUID } from "@/components/ui";
import Carousel3D from "@/components/Carousel3D";
import GlassStack from "@/components/GlassStack";
import type { ReactNode } from "react";

const CRYPTO = [
  { p: "ML-DSA-65", role: "signatures", why: "NIST FIPS 204 — post-quantum signatures on every receipt." },
  { p: "ML-KEM", role: "key exchange", why: "NIST FIPS 203 — hybrid with classical curves; harvest-now-decrypt-later fails." },
  { p: "ChaCha20", role: "encryption", why: "Fast authenticated encryption, no timing side-channels." },
  { p: "SHA-256", role: "hashing", why: "Model, weights, prompt & output hashes; Merkle tree nodes." },
];

const PARTNERS = ["Phala", "Marlin", "Atoma", "Bittensor", "AWS Nitro", "Intel TDX", "NVIDIA CC"];

const PILLARS: { n: string; t: string; s: string; body: ReactNode }[] = [
  {
    n: "01",
    t: "Decentralized",
    s: "Not anyone's cloud.",
    body: (
      <>
        <p className="text-sm leading-relaxed text-mist">
          Workloads run across an independent network of TEE nodes operated by
          node-operators we don&rsquo;t control. No single party can take the
          network down, swap a model, or surveil an inference.
        </p>
        <p className="mt-3 font-mono text-[10px] tracking-[0.18em] text-mist uppercase">
          Works with the infrastructure you already run
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PARTNERS.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: FLUID }}
              whileHover={{ y: -3 }}
              className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-fog"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </>
    ),
  },
  {
    n: "02",
    t: "Verifiable",
    s: "Math, not contracts.",
    body: (
      <p className="text-sm leading-relaxed text-mist">
        Every inference produces two artifacts alongside the output: a TEE
        attestation signed by the hardware itself — recording exactly which
        code ran, on which weights, with which inputs — and a compact
        zero-knowledge proof anyone can check on-chain without re-running the
        work. Both anchor to Base L2.{" "}
        <span className="text-fog">
          The audit trail is mathematical, not contractual.
        </span>
      </p>
    ),
  },
  {
    n: "03",
    t: "Post-quantum",
    s: "Built for 30 years, not 10.",
    body: (
      <>
        <p className="text-sm leading-relaxed text-mist">
          Every channel — client to node, node to node, node to chain — uses
          hybrid PQC. Traffic harvested today cannot be decrypted when
          cryptographically-relevant quantum computers arrive.
        </p>
        <div className="mt-4">
          <GlassStack
            items={CRYPTO.map((c) => ({
              key: c.p,
              node: (
                <div>
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-sm text-verify">{c.p}</p>
                    <p className="font-mono text-[10px] tracking-wide text-mist uppercase">
                      {c.role}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-mist">{c.why}</p>
                </div>
              ),
            }))}
          />
        </div>
      </>
    ),
  },
  {
    n: "04",
    t: "Portable",
    s: "One line to integrate.",
    body: (
      <p className="text-sm leading-relaxed text-mist">
        Same OpenAI-compatible API. Any model — open-source, proprietary,
        fine-tuned — deploys to the runtime. The protocol is open; nobody gets
        locked in. Change one line and keep everything else.
      </p>
    ),
  },
];

export default function Pillars() {
  return (
    <Station
      id="pillars"
      layer="01 · THE MOVIE"
      station="§25 · Why CooL wins"
      title={
        <>
          What Linux did for servers, <span className="text-verify">CooL does for AI.</span>
        </>
      }
      sub="Open, neutral, portable infrastructure that nobody owns. Four pillars — swipe through them."
    >
      <Reveal>
        <Carousel3D
          height={172}
          renderDetail
          items={PILLARS.map((p) => ({
            key: p.n,
            card: (
              <div className="glass-strong flex flex-col justify-between rounded-2xl p-4">
                <span className="font-mono text-xs text-verify/70">{p.n}</span>
                <div>
                  <p className="display text-2xl text-white">{p.t}</p>
                  <p className="mt-1 text-xs text-mist">{p.s}</p>
                </div>
              </div>
            ),
            detail: <div className="glass rounded-2xl p-4">{p.body}</div>,
          }))}
        />
      </Reveal>

      {/* §25 without / with — the business-model "aha" */}
      <Reveal delay={0.1}>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-fail/25 bg-fail/5 p-4">
            <MonoTag tone="fail">✕ Without CooL</MonoTag>
            <p className="mt-3 font-mono text-sm leading-relaxed text-mist">
              Every network → rebuilds trust from scratch → waste
            </p>
          </div>
          <div className="rounded-2xl border border-live/25 bg-live/5 p-4">
            <MonoTag tone="live">✓ With CooL</MonoTag>
            <p className="mt-3 font-mono text-sm leading-relaxed text-fog">
              Plug → Trust → Done
            </p>
          </div>
        </div>
      </Reveal>
    </Station>
  );
}
