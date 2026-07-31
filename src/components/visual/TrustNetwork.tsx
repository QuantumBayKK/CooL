"use client";

import { type RefObject, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export interface TrustNetworkProps {
  /**
   * Expansion progress (0..1), read every frame from a ref so scroll updates never
   * trigger React re-renders. 0 = a single point of light; 1 = a full glowing network.
   */
  progressRef: RefObject<number>;
  className?: string;
  nodeCount?: number;
}

interface Node {
  /** Target position, normalized 0..1 around the center. */
  tx: number;
  ty: number;
  /** Drift phase for subtle organic life. */
  phase: number;
  /** Activation threshold along the expansion. */
  threshold: number;
}

/**
 * The Realization's payoff (Opening spec): a point of light expands into a glowing
 * network — "the visual language transforms from human stories into invisible
 * infrastructure." 2D canvas is the right tool for a flat reveal (R3F is reserved
 * for genuinely volumetric chapters, per Technical Architecture §2).
 */
export function TrustNetwork({ progressRef, className, nodeCount = 64 }: TrustNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Deterministic-enough radial layout generated once.
    const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => {
      const ring = Math.sqrt((i + 1) / nodeCount); // denser center, sparse edge
      const angle = i * 2.399963; // golden-angle distribution
      return {
        tx: Math.cos(angle) * ring * 0.46,
        ty: Math.sin(angle) * ring * 0.46,
        phase: (i * 1.7) % (Math.PI * 2),
        threshold: ring, // outer nodes ignite later
      };
    });

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let running = false;
    const start = performance.now();

    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const render = (now: number) => {
      const time = (now - start) / 1000;
      const p = clamp01(progressRef.current ?? 0);
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height);

      ctx.clearRect(0, 0, width, height);

      // The seed point of light is always present, brightening early.
      const seed = ease(clamp01(p * 4));
      drawGlow(ctx, cx, cy, 3 + seed * 5, `rgba(95, 212, 224, ${0.5 + seed * 0.5})`);

      // Resolve current node positions + activations.
      const positions: { x: number; y: number; a: number }[] = nodes.map((n) => {
        const local = clamp01((p - n.threshold * 0.55) / 0.45);
        const a = ease(local);
        const drift = Math.sin(time * 0.6 + n.phase) * 0.004;
        const x = cx + (n.tx + drift) * scale * a;
        const y = cy + (n.ty + drift) * scale * a;
        return { x, y, a };
      });

      // Connections — light traveling through independent trust domains.
      ctx.lineWidth = 1;
      for (let i = 0; i < positions.length; i++) {
        const pi = positions[i];
        if (!pi || pi.a < 0.05) continue;
        for (let j = i + 1; j < positions.length; j++) {
          const pj = positions[j];
          if (!pj || pj.a < 0.05) continue;
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.hypot(dx, dy);
          if (dist > scale * 0.16) continue;
          const strength = (1 - dist / (scale * 0.16)) * Math.min(pi.a, pj.a) * 0.5;
          ctx.strokeStyle = `rgba(95, 212, 224, ${strength})`;
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(pj.x, pj.y);
          ctx.stroke();
        }
      }

      // Nodes.
      for (const pos of positions) {
        if (pos.a < 0.05) continue;
        drawGlow(ctx, pos.x, pos.y, 1.5 + pos.a * 2.5, `rgba(127, 227, 184, ${pos.a * 0.9})`);
      }

      if (running) raf = requestAnimationFrame(render);
    };

    // Only render while the canvas is actually on screen — two of these run in the
    // film and an always-on O(n²) glow pass is pure battery drain when scrolled past.
    const setRunning = (next: boolean) => {
      if (next === running) return;
      running = next;
      if (running) {
        raf = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => setRunning(entries.some((entry) => entry.isIntersecting)),
        { threshold: 0 },
      );
      observer.observe(canvas);
    } else {
      setRunning(true);
    }

    return () => {
      setRunning(false);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [nodeCount, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("h-full w-full", className)}
    />
  );
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 4;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}
