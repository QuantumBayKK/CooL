"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { MonoTag } from "@/components/ui";
import { DECK_MAILTO } from "@/components/Nav";
import EyeButton from "@/components/EyeButton";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

/* Loading / reduced-motion state: a quiet pool of studio light. No fake objects. */
function LightPool() {
  return (
    <div className="flex h-full items-end justify-center pb-8">
      <div className="h-10 w-56 rounded-[100%] bg-white/6 blur-2xl" />
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <section
      id="top"
      ref={ref}
      data-layer="01 · THE MOVIE"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pt-20 pb-16 text-center"
    >
      <motion.div style={{ scale, opacity, y }} className="flex w-full flex-col items-center">
        <MonoTag className="mb-4">Pre-seed · India · 2026</MonoTag>

        <SceneCanvas
          className="h-[320px] w-full max-w-xl sm:h-[400px]"
          camera={{ position: [0, 0.35, 7.2], fov: 42 }}
          fallback={<LightPool />}
        >
          <HeroScene variant="hero" sectionId="top" />
        </SceneCanvas>
        <p className="font-mono text-[10px] tracking-[0.25em] text-mist/70 uppercase">
          drag it — it&rsquo;s yours to inspect
        </p>

        <h1 className="display mt-6 max-w-[13ch] text-[clamp(2.9rem,13vw,7rem)]">
          The black box <span className="text-verify glow-blue">for AI</span>.
        </h1>

        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mist sm:text-base">
          Cryptographic Observability &amp; On-chain Ledger — a durable,
          independent, hardware-backed record of{" "}
          <span className="text-fog">what an AI actually did</span>.
        </p>

        <code className="glass mt-7 rounded-xl px-4 py-2.5 font-mono text-sm text-verify">
          cool.complete(prompt)
        </code>

        <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <EyeButton
            href="#verify"
            className="rounded-full bg-verify-deep px-7 py-3.5 font-mono text-sm text-white shadow-[0_0_28px_rgba(9,105,218,0.5)] transition-shadow hover:shadow-[0_0_40px_rgba(9,105,218,0.75)]"
          >
            Verify a receipt →
          </EyeButton>
          <a
            href={DECK_MAILTO}
            className="glass rounded-full px-7 py-3.5 font-mono text-sm text-fog transition-colors hover:text-verify"
          >
            Request the deck
          </a>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-mist uppercase"
        animate={{ y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        Scroll ↓
      </motion.div>
    </section>
  );
}
