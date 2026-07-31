"use client";

/**
 * CursorTrail — liquid-smoke ASCII cursor trail.
 *
 * A weighty spring head follows the cursor; glyphs are emitted along its
 * path (so fast strokes stretch and slow ones compress), then live inside
 * a fluid medium: curl-noise drift, Brownian sway, ripple wavefronts,
 * neighbor viscosity, drag. Canvas-2D, one rAF loop, refs only — React
 * renders exactly once.
 *
 * Disabled automatically for touch devices and prefers-reduced-motion.
 *
 * All props map 1:1 to Framer property controls — see
 * `cursorTrailPropertyControls` at the bottom for the paste-into-Framer map.
 */

import { useEffect, useRef } from "react";
import { DEFAULT_CONFIG, type TrailConfig } from "./Configuration";
import { Particle } from "./Particle";
import { SpringHead, NeighborField, applyDrag } from "./Physics";
import { RippleEngine } from "./RippleEngine";
import { PerlinNoise } from "./Noise";
import { clamp, createRng, gaussian, smoothstep } from "./Utils";

const MONO = 'ui-monospace, "SFMono-Regular", Menlo, monospace';
const SIZE_BUCKETS = [0.7, 0.9, 1.1, 1.35] as const; // × charSize

export type CursorTrailProps = Partial<TrailConfig>;

export default function CursorTrail(props: CursorTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cfgRef = useRef<TrailConfig>({ ...DEFAULT_CONFIG, ...props });
  cfgRef.current = { ...DEFAULT_CONFIG, ...props };

  useEffect(() => {
    // ---- capability gates ----
    // fine pointers get the full liquid trail; touch devices get tap-blooms.
    // reduced-motion gets silence.
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const touchMode = !fine;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rng = createRng(20260708);
    const noise = new PerlinNoise(7331);
    const head = new SpringHead();
    const field = new NeighborField();
    const ripples = new RippleEngine();
    const curl = { x: 0, y: 0 };

    // ---- pooled particles (allocated once) ----
    const capacity = clamp(cfgRef.current.particleCount, 32, 600);
    const pool: Particle[] = Array.from({ length: capacity }, () => new Particle());
    let cursor = 0; // next slot to recycle

    // ---- sizing / DPI ----
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- input ----
    const target = { x: w / 2, y: h / 2, seen: false };
    let emitDebt = 0; // px of head travel owed to emission
    let rippleDebt = 0; // px of head travel owed to ripple spawning

    /** radial bloom of glyphs — the touch-device moment of magic */
    const burst = (x: number, y: number) => {
      const cfg = cfgRef.current;
      const n = 26;
      for (let i = 0; i < n; i++) {
        const p = pool[cursor]!;
        cursor = (cursor + 1) % capacity;
        const ang = (i / n) * Math.PI * 2 + rng() * 0.5;
        const speed = 22 + rng() * 58; // a soft bloom, not a burst
        p.spawn(
          x + gaussian(rng) * 5,
          y + gaussian(rng) * 5,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed - 14, // gently biased upward — it lifts
          cfg.trailLength * 0.9,
          cfg.characters.charAt(Math.floor(rng() * cfg.characters.length)),
          Math.floor(rng() * SIZE_BUCKETS.length),
          rng,
        );
      }
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      target.seen = true;
    };
    const onDown = (e: PointerEvent) => {
      // pressing into the surface — a deliberate, stronger ripple
      ripples.spawn(e.clientX, e.clientY, 1.6);
      if (touchMode) burst(e.clientX, e.clientY);
    };
    if (!touchMode) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    // ---- emission ----
    const glyphAt = (t: number, chars: string): string =>
      chars.charAt(Math.min(Math.floor(t * chars.length), chars.length - 1));

    const emit = (x: number, y: number, hvx: number, hvy: number) => {
      const cfg = cfgRef.current;
      const p = pool[cursor]!;
      cursor = (cursor + 1) % capacity;

      const spread = cfg.cursorRadius;
      // heavier glyphs cluster near the cursor; whisper glyphs farther out
      const r = Math.abs(gaussian(rng));
      const charT = clamp(r * 0.9 + rng() * 0.2, 0, 1);
      const bucket = Math.floor(rng() * SIZE_BUCKETS.length);

      p.spawn(
        x + gaussian(rng) * spread,
        y + gaussian(rng) * spread,
        // low initial velocity: glyphs are laid down softly, not flung
        hvx * 0.1 + gaussian(rng) * 3,
        hvy * 0.1 + gaussian(rng) * 3,
        cfg.trailLength,
        glyphAt(charT, cfg.characters),
        bucket,
        rng,
      );
    };

    // ---- frame loop ----
    let raf = 0;
    let last = performance.now();
    let running = true;
    let elapsed = 0;

    const frame = (now: number) => {
      if (!running) return;
      const dt = clamp((now - last) / 1000, 0.001, 1 / 30); // refresh-rate independent
      last = now;
      elapsed += dt;
      const cfg = cfgRef.current;

      // -- head follows cursor with weight (desktop only) --
      if (target.seen && !touchMode) {
        head.update(target.x, target.y, cfg.springStrength, cfg.inertia, dt);
        const speed = head.speed();
        const travel = speed * dt;

        // emit along the path: fast strokes stretch, slow ones compress
        emitDebt += travel;
        const spacing = cfg.smokeAmount;
        while (emitDebt > spacing) {
          emitDebt -= spacing;
          // interpolate back along the velocity so the line has no gaps
          const back = emitDebt / Math.max(speed, 1);
          emit(head.x - head.vx * back, head.y - head.vy * back, head.vx, head.vy);
        }

        // movement disturbs the surface — velocity-scaled ripples
        rippleDebt += travel;
        if (rippleDebt > 110) {
          rippleDebt = 0;
          ripples.spawn(head.x, head.y, clamp(speed / 900, 0.25, 1));
        }
      }

      ripples.update(dt, 2.4);
      field.build(pool);
      field.apply(pool, cfg.viscosity, dt);

      // -- integrate particles --
      const ns = cfg.noiseScale;
      const t = elapsed * cfg.driftSpeed;
      for (const p of pool) {
        if (!p.alive) continue;
        p.age += dt;
        if (p.age >= p.life) {
          p.kill();
          continue;
        }

        // curl-noise drift: smoke suspended underwater
        noise.curl2(p.x * ns, p.y * ns, t + p.phase * 0.05, curl);
        p.vx += curl.x * cfg.noiseStrength * dt * 1.6;
        p.vy += curl.y * cfg.noiseStrength * dt * 1.6;

        // brownian whisper — nothing is ever perfectly still
        p.vx += gaussian(rng) * 1.6 * dt;
        p.vy += gaussian(rng) * 1.6 * dt;

        // buoyancy: glyphs lift off the page like embers as they age
        p.vy -= 7 * dt;

        ripples.applyTo(p, cfg.rippleRadius, cfg.rippleSpeed, cfg.rippleStrength, dt);
        applyDrag(p, cfg.drag, dt);

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotVel * dt + Math.sin(elapsed * 0.9 + p.phase) * 0.12 * dt;
      }

      // -- render, batched by size bucket to limit font churn --
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // canvas names: CSS "plus-lighter" ≙ canvas "lighter"
      ctx.globalCompositeOperation =
        cfg.blendMode === "normal"
          ? "source-over"
          : cfg.blendMode === "plus-lighter"
            ? "lighter"
            : cfg.blendMode;
      ctx.fillStyle = cfg.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let b = 0; b < SIZE_BUCKETS.length; b++) {
        const size = cfg.charSize * SIZE_BUCKETS[b]!;
        ctx.font = `${size}px ${MONO}`;
        for (const p of pool) {
          if (!p.alive || p.bucket !== b) continue;
          if (p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) continue;

          // life envelope: quick bloom in, long fade out
          const fadeIn = smoothstep(0, 0.12, p.age);
          const fadeOut =
            1 - smoothstep(p.life - cfgRef.current.fadeTime, p.life, p.age);
          const alpha = fadeIn * fadeOut * p.alphaJitter * cfg.opacity;
          if (alpha < 0.015) continue;

          // depth illusion: glyphs grow slightly as they rise toward the viewer
          const lift = 1 + p.age * 0.28;
          ctx.globalAlpha = alpha;
          ctx.setTransform(dpr * lift, 0, 0, dpr * lift, p.x * dpr, p.y * dpr);
          ctx.rotate(p.rot);
          ctx.fillText(p.char, 0, 0);
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      const visible = document.visibilityState === "visible";
      if (visible && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
    };
    // config is read via cfgRef each frame — the effect itself runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70]"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Framer property controls — paste into a Framer code component:      */
/*                                                                     */
/*   import { addPropertyControls, ControlType } from "framer"         */
/*   addPropertyControls(CursorTrail, cursorTrailPropertyControls)     */
/*                                                                     */
/* Types use ControlType names as strings so this file stays framework */
/* agnostic; swap `"number"` → ControlType.Number etc. inside Framer.  */
/* ------------------------------------------------------------------ */
export const cursorTrailPropertyControls = {
  trailLength: { type: "number", title: "Trail Length", min: 0.5, max: 8, step: 0.1, defaultValue: DEFAULT_CONFIG.trailLength },
  particleCount: { type: "number", title: "Particle Count", min: 32, max: 600, step: 1, defaultValue: DEFAULT_CONFIG.particleCount },
  rippleStrength: { type: "number", title: "Ripple Strength", min: 0, max: 400, step: 1, defaultValue: DEFAULT_CONFIG.rippleStrength },
  rippleSpeed: { type: "number", title: "Ripple Speed", min: 0.5, max: 10, step: 0.1, defaultValue: DEFAULT_CONFIG.rippleSpeed },
  viscosity: { type: "number", title: "Viscosity", min: 0, max: 8, step: 0.1, defaultValue: DEFAULT_CONFIG.viscosity },
  smokeAmount: { type: "number", title: "Smoke Amount", min: 2, max: 30, step: 0.5, defaultValue: DEFAULT_CONFIG.smokeAmount },
  drag: { type: "number", title: "Drag", min: 0, max: 8, step: 0.1, defaultValue: DEFAULT_CONFIG.drag },
  springStrength: { type: "number", title: "Spring Strength", min: 10, max: 400, step: 1, defaultValue: DEFAULT_CONFIG.springStrength },
  characters: { type: "string", title: "Character Set", defaultValue: DEFAULT_CONFIG.characters },
  charSize: { type: "number", title: "Character Size", min: 6, max: 32, step: 1, defaultValue: DEFAULT_CONFIG.charSize },
  opacity: { type: "number", title: "Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULT_CONFIG.opacity },
  blendMode: { type: "enum", title: "Blend Mode", options: ["normal", "multiply", "screen", "plus-lighter"], defaultValue: DEFAULT_CONFIG.blendMode },
  color: { type: "color", title: "Color", defaultValue: DEFAULT_CONFIG.color },
  cursorRadius: { type: "number", title: "Cursor Radius", min: 0, max: 60, step: 1, defaultValue: DEFAULT_CONFIG.cursorRadius },
  rippleRadius: { type: "number", title: "Ripple Radius", min: 40, max: 600, step: 5, defaultValue: DEFAULT_CONFIG.rippleRadius },
  driftSpeed: { type: "number", title: "Drift Speed", min: 0, max: 2, step: 0.01, defaultValue: DEFAULT_CONFIG.driftSpeed },
  noiseScale: { type: "number", title: "Noise Scale", min: 0.001, max: 0.02, step: 0.001, defaultValue: DEFAULT_CONFIG.noiseScale },
  noiseStrength: { type: "number", title: "Noise Strength", min: 0, max: 120, step: 1, defaultValue: DEFAULT_CONFIG.noiseStrength },
  inertia: { type: "number", title: "Inertia", min: 0.5, max: 0.99, step: 0.01, defaultValue: DEFAULT_CONFIG.inertia },
  fadeTime: { type: "number", title: "Fade Time", min: 0.2, max: 4, step: 0.1, defaultValue: DEFAULT_CONFIG.fadeTime },
} as const;
