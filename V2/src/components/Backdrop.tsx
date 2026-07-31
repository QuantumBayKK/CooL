"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * CryptoField — the whole set is a monospace grid of hex / symbol glyphs that
 * behaves like a cipher at rest: characters quietly scramble in place
 * (encryption churn), and every so often a "decrypt" sweep runs down a column
 * or across a row, mutating and lighting the glyphs it passes. Move the cursor
 * and the characters around it light up; scroll and a band of the grid flares.
 *
 * Performance: a dim base layer is cached to an offscreen canvas and only the
 * single cell that mutates is repainted there. Each visible frame is one
 * drawImage of that base plus a short list of lit cells (cursor halo + active
 * sweeps + scroll band). Freezes when the tab is hidden; static under
 * prefers-reduced-motion.
 */
function CryptoField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // crypto/matrix glyphs: hex-heavy, binary, and cipher symbols
    const CHARSET =
      "0123456789ABCDEF0123456789ABCDEF01<>/\\{}[]()=+*#%&$|!?^~ｦｱｳｴｵﾘﾂﾈﾊﾋﾏﾒ".split(
        "",
      );
    const SET_N = CHARSET.length;

    const CELL = 20; // px per glyph cell
    const FONT = 14; // px glyph
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let code = new Uint8Array(0); // charset index per cell
    let base: HTMLCanvasElement | null = null;
    let bctx: CanvasRenderingContext2D | null = null;

    const BASE_COLOR = "rgba(128,172,152,"; // resting glyph — cool green-grey terminal text
    const idx = (cx: number, cy: number) => cy * cols + cx;

    const setFont = (c: CanvasRenderingContext2D) => {
      c.font = `${FONT}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
    };

    /** paint one cell onto the cached base at its resting brightness */
    const paintBase = (cx: number, cy: number) => {
      if (!bctx) return;
      const x = cx * CELL;
      const y = cy * CELL;
      bctx.clearRect(x, y, CELL, CELL);
      const cval = code[idx(cx, cy)] ?? 0;
      // resting glyphs: a present-but-calm matrix backdrop that fills the whole
      // screen behind the content. Dim enough to keep text readable; the scroll
      // glow lights it up brighter on top.
      const a = 0.2 + (cval % 5 === 0 ? 0.12 : cval % 3 === 0 ? 0.06 : 0.0);
      bctx.fillStyle = BASE_COLOR + a.toFixed(3) + ")";
      bctx.fillText(CHARSET[cval]!, x + CELL / 2, y + CELL / 2);
    };

    const buildBase = () => {
      base = document.createElement("canvas");
      base.width = Math.round(w * dpr);
      base.height = Math.round(h * dpr);
      bctx = base.getContext("2d");
      if (!bctx) return;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setFont(bctx);
      code = new Uint8Array(cols * rows);
      for (let i = 0; i < code.length; i++) code[i] = (Math.random() * SET_N) | 0;
      for (let cy = 0; cy < rows; cy++)
        for (let cx = 0; cx < cols; cx++) paintBase(cx, cy);
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      setFont(ctx);
      buildBase();
      if (reduced && base) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(base, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    if (reduced) {
      return () => window.removeEventListener("resize", resize);
    }

    /* ---- bioluminescent ignition ----
       The field is a dark, still liquid at rest. Force — a scroll, a touch,
       the cursor dragging through it — disturbs the fluid, and the disturbed
       glyphs glow like plankton, then fade. cell index -> remaining life
       (1 → 0) and colour. */
    const ignited = new Map<number, { life: number; blue: boolean }>();
    const IGNITE_LIFE = 0.95; // seconds a flare takes to fade back to dark
    let igniteAcc = 0;

    /** disturb the fluid at a point — glyphs within reach flare, brightest and
        longest-lived at the centre, fading out toward the edge */
    const igniteAt = (px: number, py: number, radiusPx: number) => {
      const rc = Math.ceil(radiusPx / CELL);
      const ccx = Math.round((px - CELL / 2) / CELL);
      const ccy = Math.round((py - CELL / 2) / CELL);
      for (let dy = -rc; dy <= rc; dy++) {
        for (let dx = -rc; dx <= rc; dx++) {
          const cx = ccx + dx;
          const cy = ccy + dy;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          const dist = Math.hypot(
            cx * CELL + CELL / 2 - px,
            cy * CELL + CELL / 2 - py,
          );
          if (dist > radiusPx) continue;
          const f = 1 - dist / radiusPx; // 0 at edge → 1 at centre
          const gi = idx(cx, cy);
          const cur = ignited.get(gi);
          const life = Math.max(cur ? cur.life : 0, 0.4 + f * 0.6);
          ignited.set(gi, { life, blue: dist > radiusPx * 0.55 });
          if (Math.random() < 0.14) {
            code[gi] = (Math.random() * SET_N) | 0; // decrypt where disturbed
            paintBase(cx, cy);
          }
        }
      }
    };

    // a pointer or finger dragging through the sea lights a trail behind it
    let lastIgX = -9999;
    let lastIgY = -9999;
    const onMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - lastIgX, e.clientY - lastIgY) < 7) return;
      lastIgX = e.clientX;
      lastIgY = e.clientY;
      igniteAt(e.clientX, e.clientY, e.pointerType === "mouse" ? 86 : 66);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });

    /* ---- decrypt sweeps: a lit head travels a row or column ---- */
    interface Sweep {
      axis: 0 | 1; // 0 = column (vertical), 1 = row (horizontal)
      line: number;
      head: number; // fractional position along the axis
      speed: number; // cells / s
      len: number;
      last: number; // last integer cell mutated
      blue: boolean;
    }
    const sweeps: Sweep[] = [];
    const spawnSweep = (blue = false) => {
      if (sweeps.length >= 7) return;
      const axis: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      const line =
        axis === 0
          ? 1 + ((Math.random() * (cols - 2)) | 0)
          : 1 + ((Math.random() * (rows - 2)) | 0);
      sweeps.push({
        axis,
        line,
        head: 0,
        speed: 14 + Math.random() * 22,
        len: axis === 0 ? rows : cols,
        last: -1,
        blue,
      });
    };

    /* ---- scroll energy ---- */
    let lastScroll = window.scrollY;
    let scrollEnergy = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const v = Math.abs(y - lastScroll);
      lastScroll = y;
      scrollEnergy = Math.min(1, scrollEnergy + v * 0.006);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---- overlay accumulator: cell index -> {bright, blue} ---- */
    const lit = new Map<number, { b: number; blue: boolean }>();
    const addLit = (cx: number, cy: number, b: number, blue: boolean) => {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows || b <= 0.02) return;
      const i = idx(cx, cy);
      const prev = lit.get(i);
      if (!prev || b > prev.b) lit.set(i, { b, blue: blue || (prev?.blue ?? false) });
    };

    let raf = 0;
    let running = true;
    let last = performance.now();
    let churnAcc = 0;
    let spawnAcc = 0;

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // encryption churn — near-still at rest, quickens only under force so the
      // fluid stays calm until disturbed
      const churnRate = cols * rows * (0.01 + scrollEnergy * 0.28);
      churnAcc += churnRate * dt;
      let n = churnAcc | 0;
      churnAcc -= n;
      while (n-- > 0) {
        const cx = (Math.random() * cols) | 0;
        const cy = (Math.random() * rows) | 0;
        code[idx(cx, cy)] = (Math.random() * SET_N) | 0;
        paintBase(cx, cy);
      }

      // sweeps are currents that only run once force stirs the sea
      spawnAcc += dt;
      if (scrollEnergy > 0.14 && spawnAcc >= 0.5 - scrollEnergy * 0.35) {
        spawnAcc = 0;
        spawnSweep(Math.random() < 0.25);
        if (scrollEnergy > 0.5) spawnSweep(false);
      }

      // ignite cells: a sparse ambient glimmer at rest (lone organisms), a
      // bright sea while scrolling. Quadratic in scroll energy → still until
      // force is introduced, like a non-Newtonian fluid.
      igniteAcc += (1.4 + scrollEnergy * scrollEnergy * 380) * dt;
      let ig = igniteAcc | 0;
      igniteAcc -= ig;
      while (ig-- > 0) {
        const gx = (Math.random() * cols) | 0;
        const gy = (Math.random() * rows) | 0;
        const gi = idx(gx, gy);
        code[gi] = (Math.random() * SET_N) | 0; // decrypt as it flares
        paintBase(gx, gy);
        // at rest the glimmer is dim & brief; force makes it bright & lasting
        ignited.set(gi, { life: 0.38 + scrollEnergy * 0.62, blue: Math.random() < 0.26 });
      }

      lit.clear();

      // decay + contribute ignited flares to the overlay
      for (const [i, g] of ignited) {
        g.life -= dt / IGNITE_LIFE;
        if (g.life <= 0) {
          ignited.delete(i);
          continue;
        }
        const cx = i % cols;
        const cy = (i / cols) | 0;
        addLit(cx, cy, Math.pow(g.life, 1.3) * 0.95, g.blue);
      }

      // advance sweeps → mutate the base as the head crosses a cell, and
      // light a short trail behind the head on the overlay
      const TRAIL = 6;
      for (let s = sweeps.length - 1; s >= 0; s--) {
        const sw = sweeps[s]!;
        sw.head += sw.speed * dt;
        const hi = Math.floor(sw.head);
        if (hi !== sw.last && hi < sw.len) {
          // scramble the newly-reached cell
          const cx = sw.axis === 0 ? sw.line : hi;
          const cy = sw.axis === 0 ? hi : sw.line;
          if (cx < cols && cy < rows) {
            code[idx(cx, cy)] = (Math.random() * SET_N) | 0;
            paintBase(cx, cy);
          }
          sw.last = hi;
        }
        for (let t = 0; t <= TRAIL; t++) {
          const p = hi - t;
          if (p < 0 || p >= sw.len) continue;
          const cx = sw.axis === 0 ? sw.line : p;
          const cy = sw.axis === 0 ? p : sw.line;
          const b = (t === 0 ? 0.95 : 0.5 * (1 - t / TRAIL));
          addLit(cx, cy, b, sw.blue);
        }
        if (sw.head - TRAIL > sw.len) sweeps.splice(s, 1);
      }

      scrollEnergy = Math.max(0, scrollEnergy - dt * 0.55);

      // ---- compose: cached base, then the lit overlay ----
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base) ctx.drawImage(base, 0, 0);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setFont(ctx);
      for (const [i, v] of lit) {
        const cx = i % cols;
        const cy = (i / cols) | 0;
        const x = cx * CELL + CELL / 2;
        const y = cy * CELL + CELL / 2;
        const glyph = CHARSET[code[i] ?? 0]!;
        // near-white head → colour body → glow
        if (v.b > 0.8) {
          ctx.fillStyle = `rgba(220,255,230,${v.b})`;
          ctx.shadowColor = v.blue ? "rgba(88,166,255,0.9)" : "rgba(63,185,80,0.9)";
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = v.blue
            ? `rgba(88,166,255,${v.b})`
            : `rgba(63,185,80,${v.b})`;
          ctx.shadowColor = v.blue ? "rgba(88,166,255,0.6)" : "rgba(63,185,80,0.6)";
          ctx.shadowBlur = 5;
        }
        ctx.fillText(glyph, x, y);
      }
      ctx.shadowBlur = 0;

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
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0" aria-hidden />;
}

/**
 * The set — GitHub-dark hacker mode: a deep terminal field, a live crypto
 * character grid, a drifting blue aurora, and a vignette closing to black.
 */
export default function Backdrop() {
  const reduced = useReducedMotion();
  return (
    // z-0 (not -z-10): a negative z-index would sit BEHIND the opaque <body>
    // background and be hidden. Content is lifted to z-10 in page.tsx so it
    // still layers above this.
    <div className="fixed inset-0 z-0" aria-hidden>
      {/* deep terminal base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 80% at 50% 10%, #131a24 0%, #0d1117 55%, #07090d 100%)",
        }}
      />
      {/* the cipher grid, alive */}
      <CryptoField />
      {/* drifting blue aurora — tiny light movement */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 34% at 50% 0%, rgba(88,166,255,0.1), transparent 70%)",
        }}
        animate={reduced ? undefined : { x: ["-4%", "4%", "-4%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* whisper of terminal green, low and right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 78% 92%, rgba(63,185,80,0.05), transparent 70%)",
        }}
      />
      {/* vignette — the edges fall toward black, but gently so the cipher
          field survives at the margins */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 50%, rgba(0,0,0,0.32) 100%)",
        }}
      />
    </div>
  );
}
