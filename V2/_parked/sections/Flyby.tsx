"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Reveal, MonoTag } from "@/components/ui";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const FlybyScene = dynamic(() => import("@/three/FlybyScene"), { ssr: false });

/* Velocity interstitial: the cricket ball tears past the camera — sonic boom,
   camera shake — as the transition into "now prove it". Replays on entry & tap. */
export default function Flyby() {
  const ref = useRef<HTMLElement>(null);
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setPlayKey((k) => k + 1);
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="flyby"
      data-layer="02 · THE ENGINEER"
      className="relative h-[92svh] w-full cursor-pointer overflow-hidden"
      onPointerDown={() => setPlayKey((k) => k + 1)}
    >
      <div className="absolute inset-0">
        <SceneCanvas
          className="h-full w-full"
          camera={{ position: [0, 0, 6.2], fov: 52 }}
        >
          <FlybyScene playKey={playKey} />
        </SceneCanvas>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <Reveal>
          <MonoTag>Interlude · Velocity</MonoTag>
          <h2 className="display mt-4 max-w-[16ch] text-[clamp(2.2rem,9.5vw,4.6rem)] drop-shadow-[0_2px_18px_rgba(8,9,12,0.95)]">
            The future doesn&rsquo;t{" "}
            <span className="text-verify glow-blue">slow down.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-fog drop-shadow-[0_2px_12px_rgba(8,9,12,0.9)]">
            Regulation lands 2026–27. The primitives shipped in 2024. We build
            from India — at match pace.
          </p>
          <p className="mt-8 font-mono text-[10px] tracking-[0.25em] text-mist/70 uppercase">
            tap to replay the delivery
          </p>
        </Reveal>
      </div>
    </section>
  );
}
