"use client";

import { useEffect, useRef } from "react";
import { useExperienceStore } from "@/stores/experience.store";

interface Particle {
  x: number;
  y: number;
  /** Depth 0..1 — near (1) particles are bigger, brighter, and parallax more. */
  z: number;
  r: number;
}

/**
 * DepthField — a parallax "3D depth" canvas for the dark screens.
 *
 * Layered points drift slowly and translate against scroll + cursor at rates set by
 * their depth, so the void reads as a deep, moving space rather than a flat black.
 * A soft luminous core follows the cursor and sits behind the narration, lifting the
 * words off the dark (the "interactive background that contrasts the words"). Reads
 * scroll/cursor through refs and the store's getState — it never triggers a React
 * re-render. Honors reduced-motion (renders a calm static field).
 */
export function DepthField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useExperienceStore((s) => s.reducedMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / 14000); // density scales with area
      particles = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          r: 0.4 + z * 1.6,
        };
      });
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let t = 0;

    const render = () => {
      t += 0.0035;
      // Ease cursor for a calm, weighted follow.
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      const progress = useExperienceStore.getState().scrollProgress;
      // Parallax offsets: scroll pushes the field, cursor nudges it.
      const scrollPush = progress * height * 1.4;
      const px = (pointer.x - 0.5) * 2;
      const py = (pointer.y - 0.5) * 2;

      ctx.clearRect(0, 0, width, height);

      // Contrast core — a soft glow behind the centered narration that follows the
      // cursor, so the words always sit on a lifted, dynamic ground.
      const cx = width * (0.5 + px * 0.08);
      const cy = height * (0.46 + py * 0.06);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.55);
      glow.addColorStop(0, "rgba(103, 211, 230, 0.07)");
      glow.addColorStop(0.4, "rgba(30, 40, 55, 0.10)");
      glow.addColorStop(1, "rgba(5, 6, 10, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const depth = 0.25 + p.z; // near particles parallax more
        // Wrap vertical scroll-parallax within the viewport for an endless field.
        let y = (p.y - scrollPush * depth * 0.12) % height;
        if (y < 0) y += height;
        const x =
          (p.x + px * depth * 26 + Math.sin(t + p.z * 6) * depth * 8 + width) % width;

        const twinkle = 0.5 + 0.5 * Math.sin(t * 1.6 + p.x);
        const alpha = (0.12 + p.z * 0.5) * (reduced ? 0.6 : twinkle);
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(154, 163, 180, ${alpha})`;
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
