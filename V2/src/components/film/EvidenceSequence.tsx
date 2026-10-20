"use client";

import { useEffect, useRef, useState } from "react";

import { PIPELINE, PIPELINE_NOTE } from "@/content/copy";

import { StatusChip } from "./HudFrame";

/**
 * Sequence B — the evidence pipeline.
 *
 * capture → canonicalise → bind → sign → log → verify. Scrolling through the
 * section lights the stages in order; each glyph starts as disconnected
 * fragments (dashed, offset strokes) and resolves into a legible mark when its
 * stage is reached. Under reduced motion every stage is lit from the start.
 * Status chips come from the copy registry, which takes them from claims.
 */

const GLYPHS: Record<string, string> = {
  capture: "M4 20h32M20 4v32M10 10l20 20M30 10L10 30",
  canonicalise: "M6 8h28M6 16h20M6 24h28M6 32h14",
  bind: "M8 20a8 8 0 0 1 8-8h8M32 20a8 8 0 0 1-8 8h-8M14 20h12",
  sign: "M6 30c6-12 10-18 14-18s2 10 6 10 4-6 8-6M6 34h28",
  log: "M20 4v8M20 12L10 22M20 12l10 10M10 22v6M30 22v6M6 28h8v6H6zM26 28h8v6h-8z",
  verify: "M6 20l9 9L34 10M4 4h32v32H4z",
};

export function EvidenceSequence() {
  const root = useRef<HTMLOListElement>(null);
  const [lit, setLit] = useState(PIPELINE.length);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setLit(0);
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = root.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const start = innerHeight * 0.85;
      const span = r.height + innerHeight * 0.35;
      const p = Math.max(0, Math.min(1, (start - r.top) / span));
      setLit(Math.round(p * PIPELINE.length));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div>
      <ol ref={root} className="f-pipe" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {PIPELINE.map((s, i) => {
          const on = i < lit;
          return (
            <li key={s.id} className="f-pipe__stage" data-lit={on}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className="f-label">[ B · {String(i + 1).padStart(2, "0")} ]</span>
                <StatusChip status={s.status} />
              </div>
              <h3 className="f-h3">{s.name}</h3>
              <p className="f-body f-small">{s.body}</p>
              <p className="f-label">{s.note}</p>
              <svg className="f-pipe__glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path
                  className="f-pipe__frag"
                  d={GLYPHS[s.id]}
                  pathLength={100}
                  strokeDasharray={on ? "100 0" : "6 10"}
                  strokeDashoffset={on ? 0 : 30}
                />
              </svg>
            </li>
          );
        })}
      </ol>
      <p className="f-label" style={{ marginTop: 20 }}>
        <span className="f-chip f-chip--simulated" style={{ marginRight: 10 }}>
          Simulated
        </span>
        {PIPELINE_NOTE}
      </p>
    </div>
  );
}
