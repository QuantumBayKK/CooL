"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { animate, utils } from "animejs";
import { FLUID, INTRO_DARK_MS, prefersReduced } from "@/lib/motion";

const IntroScene = dynamic(() => import("@/three/IntroScene"), { ssr: false });

const SESSION_KEY = "cool:intro-played";

/** layout effects run before paint on the client, and are a no-op on the server */
const useBeforePaint =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * IntroSequence — the cold open, and the handoff into the site.
 *
 * The order the sequence runs, which is the order it was asked for:
 *   1. the cube turns and opens in a shaft of light, on black
 *   2. it flies to the exact slot it occupies on the cover slide
 *   3. the black fades away in reverse, revealing the nav, the cipher field
 *      and the rest of the site behind it
 *
 * Two details make it feel like one object rather than two:
 *   · the 3D beat ends with the cube re-sealed, which is precisely how the
 *     hero's own cube sits at rest;
 *   · step 2 measures `[data-hero-stage]` and scales this canvas uniformly by
 *     the slot's height ratio, so the cube lands at the size the hero would
 *     have drawn it. The final cross-fade then hides any residual difference.
 *
 * The black bed is rendered on the server, so the very first paint is black —
 * there is no flash of the site before the intro starts.
 */
export default function IntroSequence() {
  // Read the session flag during the very first render. On the server this is
  // always false, so the black bed ships in the HTML and the first paint of a
  // fresh visit is black. On a client-side navigation back to "/" the flag is
  // already set, so the overlay is never rendered at all — without this the
  // curtain would appear for a frame before the effect could remove it.
  const [done, setDone] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const root = useRef<HTMLDivElement>(null);
  const bed = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const finishing = useRef(false);
  const [mounted, setMounted] = useState(false);

  /** release the page: unlock scrolling, drop the overlay, remember we played */
  const teardown = useCallback(() => {
    document.documentElement.style.overflow = "";
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* private mode — replaying the intro is a fine fallback */
    }
    setDone(true);
  }, []);

  /* Decide whether to play at all. This runs before the browser paints, so a
     visitor who prefers reduced motion never sees the curtain flash. */
  useBeforePaint(() => {
    if (started.current) return;
    started.current = true;

    let played = false;
    try {
      played = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      played = false;
    }

    if (played || prefersReduced()) {
      teardown();
      return;
    }

    // hold the page at the top and freeze scrolling for the duration
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = "hidden";
    setMounted(true);
  }, [teardown]);

  /**
   * The cube has sealed. Put the DOM bloom out in step with the 3D backlight,
   * so the whole light source dies as one thing before anything moves.
   */
  const dimGlow = useCallback(() => {
    const glowEl = glow.current;
    if (!glowEl) return;
    animate(glowEl, {
      opacity: 0,
      duration: INTRO_DARK_MS,
      ease: "inOutQuad",
    });
  }, []);

  /** step 2 + 3 — fly to the hero slot, then reverse-fade the black away */
  const handoff = useCallback(
    async (fast = false) => {
      if (finishing.current) return;
      finishing.current = true;

      const stageEl = stage.current;
      const bedEl = bed.current;
      const glowEl = glow.current;
      const rootEl = root.current;

      if (!stageEl || !bedEl) {
        teardown();
        return;
      }
      // let the page underneath receive input from here on
      rootEl?.style.setProperty("pointer-events", "none");

      // the cover ships a phone slot and a desktop slot; exactly one of them is
      // laid out, so take the first with real dimensions
      const slot = Array.from(
        document.querySelectorAll<HTMLElement>("[data-hero-stage]"),
      ).find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      });
      const flyMs = fast ? 320 : 620;

      // on the normal path the glow has already faded with the 3D backlight;
      // on a skip it still needs putting out before the flight
      if (glowEl && fast) {
        animate(glowEl, { opacity: 0, duration: 180, ease: "linear" });
      }

      /* ---- 2 + 3, deliberately overlapped ----
         The old sequence flew the cube, stopped, and only then lifted the
         black — two separate moves with a visible seam between them. Running
         the reveal underneath the tail of the flight is what makes the handoff
         read as one motion: by the time the cube reaches its slot the site is
         already there behind it, and the intro canvas dissolves into the
         hero's own canvas rather than cutting to it. */
      const revealMs = fast ? 300 : 460;

      // the black lifts while the cube is still travelling
      animate(bedEl, {
        opacity: 0,
        duration: revealMs,
        delay: flyMs * 0.45,
        ease: "linear",
      });

      // the intro canvas cross-fades into the hero's, landing together
      animate(stageEl, {
        opacity: 0,
        duration: revealMs * 0.55,
        delay: flyMs * 0.72,
        ease: "linear",
      });

      if (slot) {
        const r = slot.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        // uniform, so the perspective is never squashed
        const scale = Math.max(r.height / vh, 0.08);
        const dx = r.left + r.width / 2 - vw / 2;
        const dy = r.top + r.height / 2 - vh / 2;
        await animate(stageEl, {
          translateX: dx,
          translateY: dy,
          scale,
          duration: flyMs,
          ease: FLUID,
        });
      } else {
        await new Promise((r) => setTimeout(r, flyMs));
      }

      // let the two fades finish before the overlay leaves the tree
      await new Promise((r) => setTimeout(r, revealMs * 0.6));

      teardown();
    },
    [teardown],
  );

  /* let people out — any deliberate input skips straight to the site */
  useEffect(() => {
    if (!mounted || done) return;
    const skip = () => handoff(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") skip();
    };
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("touchstart", skip, { passive: true, once: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, done, handoff]);

  /* safety net: never trap the user if WebGL fails or the GLB never loads */
  useEffect(() => {
    if (!mounted || done) return;
    // a healthy run reaches the handoff at ~1.7s; this only fires if WebGL died
    // or the GLB never arrived, so it sits just past that with room to spare
    const bail = window.setTimeout(() => handoff(true), 3600);
    return () => window.clearTimeout(bail);
  }, [mounted, done, handoff]);

  useEffect(
    () => () => {
      // unmounting mid-flight must not leave the page frozen
      document.documentElement.style.overflow = "";
      const live = [bed.current, stage.current, glow.current].filter(
        (n): n is HTMLDivElement => n != null,
      );
      if (live.length) utils.remove(live);
    },
    [],
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[95]"
      aria-hidden
      role="presentation"
    >
      {/* the black bed — present in the server HTML, so first paint is black */}
      <div ref={bed} className="absolute inset-0 bg-black" />
      {/* a DOM-side bloom, so the light behind the object reads even before
          WebGL has finished compiling shaders */}
      <div
        ref={glow}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 34% at 50% 46%, rgba(88,166,255,0.18), transparent 70%)",
        }}
      />

      {mounted ? (
        <div ref={stage} className="absolute inset-0">
          <Canvas
            className="absolute inset-0"
            shadows="soft"
            dpr={[1, 1.6]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
              toneMappingExposure: 1.12,
            }}
            camera={{ position: [0, 0.3, 6.8], fov: 42 }}
          >
            <IntroScene
              onSealed={dimGlow}
              onLightsOut={() => handoff(false)}
            />
          </Canvas>
        </div>
      ) : null}

      {/* No skip control, and no caption. At ~2.5s door to door there is
          nothing to escape from, and a button that appears and vanishes inside
          that window reads as a glitch rather than an affordance. Any wheel,
          touch or key still cuts straight to the site — see the effect above —
          so nobody is ever held here; the escape hatch is simply invisible. */}
    </div>
  );
}
