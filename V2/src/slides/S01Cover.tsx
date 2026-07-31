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

/* The glowing ask â€” the point of this slide. */
function AskBox({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative mx-auto block w-full max-w-md overflow-hidden rounded-2xl border border-verify/40 bg-panel px-5 py-6 text-center shadow-[0_0_44px_rgba(88,166,255,0.28),0_8px_28px_rgba(0,0,0,0.4)] sm:w-fit sm:px-10">
      <span aria-hidden className="shimmer-ring absolute inset-0 rounded-2xl" />
      <p className="kicker relative border-b border-verify/40 pb-2 text-[15px]">
        Pre-seed ask
      </p>
      <p
        className={
          compact
            ? "display relative mt-3 text-[clamp(2.8rem,15vw,4.2rem)] whitespace-nowrap text-ink"
            : "display relative mt-3 text-[clamp(3.4rem,9vw,5.4rem)] whitespace-nowrap text-ink"
        }
      >
        â‚¹1 Crore
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
 *
 * So the cover now asks for exactly one thing: start the story. The demo and
 * the console are still one tap away in the nav for anyone who wants to jump,
 * but they no longer compete with the only action that matters here.
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
        Two minutes. Ends with a live system you can break yourself.
      </p>
    </div>
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

            <p className="mx-auto mt-3 max-w-[34ch] text-[15px] leading-snug font-semibold text-ink">
              Every AI change your company makes â€” documented, approved, filed and
              provable. Automatically.
            </p>

            <div className="mt-2">
              <HeroStage className="h-[196px] w-full" />
            </div>

            <p className="mx-auto max-w-[36ch] text-[13.5px] leading-relaxed text-fog">
              Weeks of manual compliance work a year, gone. Costs down by up to
              90%. Zero engineering time.
            </p>

            <div className="mt-4">
              <AskBox compact />
            </div>

            <div className="mt-5 w-full">
              <Cta stack />
            </div>

            <p className="mt-3 font-mono text-[11px] leading-relaxed font-semibold text-mist">
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

            <p className="mt-6 max-w-lg text-[22px] leading-tight font-semibold text-ink">
              Every AI change your company makes â€” documented, approved, filed and
              provable. Automatically.
            </p>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fog">
              The paperwork behind AI changes burns weeks of engineering time a
              year and stalls your biggest deals in security review. CooL deletes
              that work and cuts the cost by up to 90%.
            </p>

            <div className="mt-7">
              <Cta />
            </div>

            <p className="mt-6 font-mono text-[12px] leading-relaxed font-semibold text-mist">
              Northwind Cipher Pvt Ltd Â· Pranauv Shrinaath S, CEO Â· Kailosh
              Kalimuthu, CTO
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <HeroStage className="h-[230px] w-full sm:h-[260px]" />
            <div className="mt-5">
              <AskBox />
            </div>
          </Reveal>
        </div>
      </SlideFrame>
    </section>
  );
}
