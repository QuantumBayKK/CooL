"use client";

import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/ui";
import { SlideFrame } from "@/components/Slide";
import Magnetic from "@/components/Magnetic";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const HeroScene = dynamic(() => import("@/three/HeroScene"), { ssr: false });

function LightPool() {
  return (
    <div className="flex h-full items-end justify-center pb-8">
      <div className="h-10 w-56 rounded-[100%] bg-verify/15 blur-2xl" />
    </div>
  );
}

/* Claymorphic bloom â€” soft light pooled behind the object so it reads on dark */
function ClayGlow() {
  return (
    <div
      aria-hidden
      className="clay-glow pointer-events-none absolute inset-0 -z-10"
    />
  );
}

/**
 * The object's slot on the cover.
 *
 * `data-hero-stage` is the landing target the intro sequence measures and flies
 * its cube into. Both the phone and desktop layouts carry the attribute; the
 * intro picks whichever one is actually laid out (the other is display:none).
 */
function HeroStage({ className }: { className: string }) {
  return (
    <div className="relative" data-hero-stage>
      <ClayGlow />
      <SceneCanvas
        className={className}
        camera={{ position: [0, 0.3, 6.8], fov: 42 }}
        fallback={<LightPool />}
      >
        <HeroScene variant="hero" sectionId="cover" />
      </SceneCanvas>
    </div>
  );
}

/**
 * The ask.
 *
 * Rebuilt because the old card broke at both ends. `whitespace-nowrap` on a
 * `15vw` display face set "â‚¹1 Crore" wider than a 360px phone and shoved the
 * card sideways, and the rotating shimmer ring drew a hard seam over the border
 * on dark. It is now a plain figure that cannot overflow: the number sits on
 * its own line and the type scales off the container rather than the viewport.
 */
function AskBox() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-verify/35 bg-panel/80 px-5 py-5 text-center backdrop-blur-xl">
      <p className="font-mono text-[10.5px] tracking-[0.24em] text-verify uppercase">
        Pre-seed ask
      </p>
      <p className="display mt-2.5 text-[clamp(2.4rem,7vw,3.2rem)] leading-none text-ink">
        â‚¹1 Cr
      </p>
      <p className="mt-2.5 border-t border-line pt-2.5 font-mono text-[11px] leading-relaxed text-mist">
        SAFE Â· â‚¹10 Cr cap Â· 12-month runway
      </p>
    </div>
  );
}

/**
 * One action.
 *
 * This used to be three buttons of near-equal weight â€” deck, demo, dashboard â€”
 * which is three exits from the first screen and no path through it. A reader
 * who has to choose before they know anything usually chooses to leave.
 */
function Cta({ stack = false }: { stack?: boolean }) {
  return (
    <div className={stack ? "w-full" : undefined}>
      <Magnetic className={stack ? "block w-full" : "inline-block"}>
        <ShimmerButton
          type="button"
          onClick={() =>
            document.querySelector("#problem")?.scrollIntoView({ behavior: "smooth" })
          }
          className={stack ? "w-full" : undefined}
        >
          Show me
          <ArrowDown className="size-4" strokeWidth={2.2} />
        </ShimmerButton>
      </Magnetic>
      <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-mist">
        Two minutes.
      </p>
    </div>
  );
}

/**
 * The promise, in one sentence.
 *
 * The previous version stacked four past-participles onto a dash â€” "documented,
 * approved, filed and provable. Automatically." â€” which reads as a feature list
 * wearing a sentence's clothes, and asks a compliance officer to work out the
 * subject. This says who does what, in order, in the language a bank or a
 * hospital already uses for this work.
 *
 * NOT named `Promise`. It was, and that shadowed the global `Promise` for this
 * whole module â€” so the `next/dynamic` loader generated for the two imports at
 * the top of this file called `Promise.all(...)`, found a React component, and
 * threw `b.all is not a function` on hydration. The page rendered on the server
 * and then died in the browser. Module-scope identifiers must never collide
 * with globals that bundler-generated code relies on.
 */
function HeroPromise({ className }: { className?: string }) {
  return (
    <p className={className}>
      Your teams change their AI every day. Every change has to be written up,
      approved and filed for the auditor.{" "}
      <span className="text-ink">CooL does all of it, by itself.</span>
    </p>
  );
}

export default function S01Cover() {
  return (
    <section
      id="cover"
      data-slide="01"
      data-layer="01 Â· COVER"
      className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl snap-start items-center px-5 pt-24 pb-14 lg:pt-24 lg:pb-16"
    >
      <SlideFrame mode="fall" className="w-full">
        {/* ---------- phone: poster flow ---------- */}
        <div className="flex w-full flex-col items-center text-center lg:hidden">
          <Reveal className="w-full">
            <h1 className="display mx-auto max-w-[8ch] text-[clamp(4rem,21vw,6.4rem)]">
              CooL
            </h1>
            <p className="kicker mt-1 text-[13px]">The black box for AI</p>

            <div className="mt-2">
              <HeroStage className="h-[188px] w-full" />
            </div>

            <HeroPromise className="mx-auto max-w-[34ch] text-[15px] leading-relaxed font-medium text-fog" />

            <p className="mx-auto mt-3 max-w-[32ch] text-[13.5px] leading-relaxed text-mist">
              Weeks of manual work a year, gone. Audit costs down by up to 90%.
            </p>

            <div className="mt-5">
              <AskBox />
            </div>

            <div className="mt-5 w-full">
              <Cta stack />
            </div>

            <p className="mt-4 font-mono text-[10.5px] leading-relaxed text-mist">
              Northwind Cipher Pvt Ltd Â· Pranauv Shrinaath S, CEO Â· Kailosh
              Kalimuthu, CTO
            </p>
          </Reveal>
        </div>

        {/* ---------- desktop: editorial split ---------- */}
        <div className="hidden w-full items-center gap-10 lg:grid lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <h1 className="display max-w-[8ch] text-[clamp(5.5rem,13vw,8.4rem)]">
              CooL
            </h1>
            <p className="kicker mt-2 text-[15px]">The black box for AI</p>

            <HeroPromise className="mt-6 max-w-lg text-[20px] leading-relaxed font-medium text-fog" />

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mist">
              Weeks of manual work a year, gone. Audit costs down by up to 90%.
              No engineering time.
            </p>

            <div className="mt-7">
              <Cta />
            </div>

            <p className="mt-6 font-mono text-[11.5px] leading-relaxed text-mist">
              Northwind Cipher Pvt Ltd Â· Pranauv Shrinaath S, CEO Â· Kailosh
              Kalimuthu, CTO
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <HeroStage className="h-[230px] w-full sm:h-[260px]" />
            <div className="mt-6">
              <AskBox />
            </div>
          </Reveal>
        </div>
      </SlideFrame>
    </section>
  );
}
