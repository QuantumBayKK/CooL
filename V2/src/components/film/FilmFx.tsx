"use client";

import { useEffect, useRef, useState } from "react";

import { ImpactPlanner, ParticlePool, type Intensity } from "@/lib/film/detonation";
import { MOTION } from "@/lib/film/motion";
import { readMotionProfile, type MotionProfile } from "@/lib/film/reducedMotion";

/**
 * The single effect engine: pixel debris, ring, flash, shake, seismograph and
 * cursor, mounted once in the film layout.
 *
 * Any element with `data-impact="small|full|max"` triggers an impact when it
 * is activated. It listens to `click`, which browsers already fire for Enter
 * and Space on buttons and Enter on links — so keyboard activation works and
 * is never duplicated. All drawing is on one fixed canvas with
 * pointer-events:none; the rAF loop only runs while something is alive.
 */

type Spike = { t: number; amp: number };
const spikes: Spike[] = [];

export default function FilmFx() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const seis = useRef<HTMLCanvasElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [grain, setGrain] = useState(false);

  useEffect(() => {
    const profile: MotionProfile = readMotionProfile();
    const root = document.querySelector<HTMLElement>(".film");
    root?.classList.add("is-js");
    // Grain is texture, not content: add it once the page has loaded and idled.
    const addGrain = () => setTimeout(() => setGrain(true), 1500);
    if (document.readyState === "complete") addGrain();
    else addEventListener("load", addGrain, { once: true });
    const planner = new ImpactPlanner({ reduced: profile.reduced, lowPower: profile.lowPower });
    const pool = new ParticlePool(profile.lowPower ? 48 : 160);
    const rings: { x: number; y: number; r: number; px: number; life: number }[] = [];

    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const sv = seis.current!;
    const sctx = sv.getContext("2d")!;
    let dpr = 1;
    let raf = 0;

    // The full-viewport debris canvas stays 1×1 until the first impact:
    // a screen-sized backing store at 2× DPR is real memory and compositing
    // cost on every page that is never clicked.
    let fxSized = false;
    const sizeFx = () => {
      cv.width = Math.floor(innerWidth * dpr);
      cv.height = Math.floor(innerHeight * dpr);
      fxSized = true;
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MOTION.maxDpr);
      if (fxSized) sizeFx();
      sv.width = Math.floor(innerWidth * dpr);
      sv.height = Math.floor(18 * dpr);
      drawSeis(performance.now());
    };

    const drawSeis = (now: number) => {
      const w = sv.width;
      const h = sv.height;
      const mid = Math.floor(h / 2);
      sctx.clearRect(0, 0, w, h);
      sctx.fillStyle = "#fff";
      const step = Math.max(2, Math.floor(3 * dpr));
      for (let x = 0; x < w; x += step) {
        let y = 0;
        for (const s of spikes) {
          const age = (now - s.t) / 900;
          if (age > 1) continue;
          const sx = (s.t * 0.37) % w;
          const d = Math.abs(x - sx) / (60 * dpr);
          y += Math.sin(x * 0.35) * s.amp * Math.exp(-d * d) * (1 - age) * mid;
        }
        sctx.fillRect(x, mid + Math.round(y / step) * step, step, Math.max(1, Math.floor(dpr)));
      }
    };

    const loop = (now: number) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#fff";
      const alive = pool.step();
      for (const p of pool.items) {
        if (!p.alive) continue;
        const s = p.size * dpr;
        // Snap to the debris' own pixel grid — square, hard-edged, no AA.
        ctx.fillRect(Math.round((p.x * dpr) / s) * s, Math.round((p.y * dpr) / s) * s, s, s);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        if (!ring) continue;
        ring.r += 9;
        ring.life++;
        const s = ring.px * dpr;
        const n = Math.max(16, Math.floor(ring.r / 3));
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          const x = (ring.x + Math.cos(a) * ring.r) * dpr;
          const y = (ring.y + Math.sin(a) * ring.r) * dpr;
          ctx.fillRect(Math.round(x / s) * s, Math.round(y / s) * s, s, s);
        }
        if (ring.life > 14) rings.splice(i, 1);
      }
      drawSeis(now);
      const seisLive = spikes.some((s) => now - s.t < 900);
      if (alive > 0 || rings.length > 0 || seisLive) raf = requestAnimationFrame(loop);
      else {
        raf = 0;
        ctx.clearRect(0, 0, cv.width, cv.height);
        spikes.length = 0;
        drawSeis(now);
      }
    };
    const kick = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const impact = (el: HTMLElement, requested: Intensity, x: number, y: number) => {
      const now = performance.now();
      if (!fxSized) sizeFx();
      const plan = planner.plan(requested, now);
      if (plan.inversionOnly) {
        el.classList.add("f-inverted-once");
        window.setTimeout(() => el.classList.remove("f-inverted-once"), MOTION.inversionFlash);
        return;
      }
      pool.emit(plan.particles, x, y, plan.pixel);
      if (plan.ring) rings.push({ x, y, r: 6, px: plan.pixel, life: 0 });
      if (plan.flash && flash.current) {
        const f = flash.current;
        f.classList.remove("is-on");
        void f.offsetWidth;
        f.classList.add("is-on");
      }
      if (plan.shake > 0) {
        const target = el.closest<HTMLElement>("section, header, .f-hud") ?? el;
        target.style.setProperty("--amp", String(plan.shake));
        target.classList.remove("f-shake");
        void target.offsetWidth;
        target.classList.add("f-shake");
        window.setTimeout(() => target.classList.remove("f-shake"), 200);
      }
      spikes.push({ t: now, amp: plan.intensity === "small" ? 0.35 : 0.9 });
      kick();
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-impact]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Keyboard activation reports 0,0 — burst from the element's centre.
      const fromPointer = e.detail > 0 && (e.clientX !== 0 || e.clientY !== 0);
      const x = fromPointer ? e.clientX : r.left + r.width / 2;
      const y = fromPointer ? e.clientY : r.top + r.height / 2;
      impact(el, (el.dataset.impact as Intensity) || "small", x, y);
    };

    /* cursor ------------------------------------------------------------ */
    const cur = cursor.current!;
    const useCursor = profile.finePointer;
    let cx = -100;
    let cy = -100;
    let cursorRaf = 0;
    const moveCursor = () => {
      cursorRaf = 0;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      root?.classList.remove("is-keyboard");
      cx = e.clientX;
      cy = e.clientY;
      if (!cursorRaf) cursorRaf = requestAnimationFrame(moveCursor);
      const hit = (e.target as HTMLElement | null)?.closest("a, button, [data-impact], label, input, select");
      cur.dataset.armed = hit ? "true" : "false";
      if (label.current) label.current.textContent = hit ? "ARM" : "";
    };
    const onDown = () => {
      if (cur.dataset.armed === "true" && label.current) label.current.textContent = "DETONATE";
    };
    const onUp = () => {
      if (cur.dataset.armed === "true" && label.current) label.current.textContent = "ARM";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") root?.classList.add("is-keyboard");
    };

    resize();
    addEventListener("resize", resize);
    document.addEventListener("click", onClick);
    addEventListener("keydown", onKey);
    if (useCursor) {
      root?.classList.add("has-cursor");
      cur.hidden = false;
      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("pointerdown", onDown);
      addEventListener("pointerup", onUp);
    }
    const onVis = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      removeEventListener("resize", resize);
      document.removeEventListener("click", onClick);
      removeEventListener("keydown", onKey);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVis);
      root?.classList.remove("has-cursor");
      if (raf) cancelAnimationFrame(raf);
      if (cursorRaf) cancelAnimationFrame(cursorRaf);
    };
  }, []);

  return (
    <>
      <canvas ref={seis} className="f-seis" aria-hidden="true" style={{ width: "100%", height: 18 }} />
      <canvas ref={canvas} className="f-fx" aria-hidden="true" width={1} height={1} style={{ width: "100vw", height: "100vh" }} />
      <div ref={flash} className="f-flash" aria-hidden="true" />
      <div ref={cursor} className="f-cursor" aria-hidden="true" hidden data-armed="false" style={{ transform: "translate3d(-200px, -200px, 0)" }}>
        <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" shapeRendering="crispEdges">
          <path d="M2 10V2h8M26 2h8v8M34 26v8h-8M10 34H2v-8" />
          <path d="M18 12v4M18 20v4M12 18h4M20 18h4" />
        </svg>
        <span ref={label} className="f-cursor__label" />
      </div>
      {grain && <div className="f-grain" aria-hidden="true" />}
    </>
  );
}
