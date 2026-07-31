"use client";

import dynamic from "next/dynamic";
import { Reveal, MonoTag } from "@/components/ui";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const GravityScene = dynamic(() => import("@/three/GravityScene"), { ssr: false });

/* Interactive interstitial: the stakes, made physical. Your cursor is the
   singularity; the payload drops; the field bends. */
export default function Gravity() {
  return (
    <section
      id="gravity"
      data-layer="01 · THE MOVIE"
      className="relative h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <SceneCanvas
          className="h-full w-full"
          camera={{ position: [0, 0, 9.5], fov: 50 }}
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="size-40 rounded-full border border-verify/30 bg-verify/5 blur-none" />
            </div>
          }
        >
          <GravityScene />
        </SceneCanvas>
      </div>

      {/* copy overlay — never blocks the physics */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-5 py-16">
        <Reveal className="mx-auto w-full max-w-xl pt-8 md:max-w-2xl">
          <MonoTag>Interlude · The stakes</MonoTag>
          <h2 className="display mt-3 text-[clamp(1.9rem,8vw,3.4rem)] drop-shadow-[0_2px_18px_rgba(8,9,12,0.9)]">
            Unverifiable AI is a{" "}
            <span className="text-fail">payload in freefall.</span>
          </h2>
        </Reveal>

        <Reveal className="mx-auto w-full max-w-xl pb-10 md:max-w-2xl">
          <p className="max-w-md text-sm leading-relaxed text-fog drop-shadow-[0_2px_12px_rgba(8,9,12,0.9)]">
            You&rsquo;re the singularity — <span className="text-white">drag</span>.
            Everything bends toward the strongest force in the field. In AI
            today, that force is &ldquo;trust&nbsp;me.&rdquo;
          </p>
          <a
            href="#verify"
            className="pointer-events-auto mt-5 inline-block rounded-full bg-verify-deep px-6 py-3 font-mono text-xs text-white shadow-[0_0_24px_rgba(9,105,218,0.5)]"
          >
            Make evidence the strongest force ↓
          </a>
          <p className="mt-4 font-mono text-[10px] tracking-[0.25em] text-mist/70 uppercase">
            move your cursor / drag your finger
          </p>
        </Reveal>
      </div>
    </section>
  );
}
