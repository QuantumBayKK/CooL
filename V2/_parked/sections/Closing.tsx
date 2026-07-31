"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui";
import { DECK_MAILTO } from "@/components/Nav";
import ScrollTextReveal from "@/components/ScrollTextReveal";
import { hasModel } from "@/three/models.generated";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

const LIBRARY = [
  { t: "FIPS 203 (ML-KEM)", href: "https://csrc.nist.gov/pubs/fips/203/final" },
  { t: "FIPS 204 (ML-DSA)", href: "https://csrc.nist.gov/pubs/fips/204/final" },
  { t: "Whitepaper — on request", href: DECK_MAILTO },
  { t: "Architecture — on request", href: DECK_MAILTO },
];

export default function Closing() {
  return (
    <footer
      id="closing"
      data-layer="03 · DUE DILIGENCE"
      className="relative mx-auto max-w-2xl px-5 pt-24 pb-12 text-center"
    >
      {hasModel("product") && (
        <SceneCanvas
          className="mx-auto h-[240px] w-full max-w-lg"
          camera={{ position: [0, 0.1, 5.6], fov: 42 }}
        >
          {/* the standard, receding into infrastructure */}
          <HeroScene variant="vision" sectionId="closing" />
        </SceneCanvas>
      )}

      <Reveal>
        <ScrollTextReveal
          className="display text-[clamp(2.2rem,10vw,4.5rem)]"
          segments={[
            { text: "Fund the evidentiary standard" },
            {
              text: "the next decade of regulated AI runs on.",
              className: "text-verify glow-blue",
            },
          ]}
        />

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={DECK_MAILTO}
            className="w-full max-w-sm rounded-full bg-verify-deep px-8 py-4 font-mono text-sm text-white shadow-[0_0_32px_rgba(9,105,218,0.55)] transition-shadow hover:shadow-[0_0_48px_rgba(9,105,218,0.8)] sm:w-auto"
          >
            Request the deck →
          </a>
          <a
            href="#verify"
            className="glass w-full max-w-sm rounded-full px-8 py-4 font-mono text-sm text-fog sm:w-auto"
          >
            Verify a receipt ↑
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-14 mb-3 font-mono text-[11px] tracking-[0.18em] text-mist uppercase">
          §23 · Research library
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {LIBRARY.map((l) => (
            <a
              key={l.t}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="rounded-full border border-line px-4 py-2 font-mono text-[11px] text-mist transition-colors hover:border-verify/50 hover:text-verify"
            >
              {l.t}
            </a>
          ))}
        </div>
      </Reveal>

      <div className="mt-16 border-t border-line pt-8">
        <p className="flex items-baseline justify-center gap-1.5">
          <span className="display text-lg text-white">CooL</span>
          <span className="inline-block size-1 bg-verify" aria-hidden />
        </p>
        <p className="mt-2 font-mono text-[11px] text-mist">
          Northwind Cipher · Pre-seed · India · 2026
        </p>
        <p className="mt-4 font-mono text-xs tracking-[0.14em] text-verify uppercase">
          Don&rsquo;t trust us. Verify.
        </p>
      </div>
    </footer>
  );
}
