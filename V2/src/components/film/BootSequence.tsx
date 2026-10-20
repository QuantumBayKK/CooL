"use client";

import { useEffect, useState } from "react";

/**
 * A 1.2s boot overlay, once per browser session. Decorative: aria-hidden and
 * pointer-events:none, so it can never block a click or a screen reader, and
 * it never runs under reduced motion. Session storage is read defensively —
 * a private window that throws simply skips the boot.
 */
const LINES = [
  "COOL RECORDER · cold start",
  "load verifier ............ cool.receipt.v1",
  "load keys ................ ml-dsa-65 + ed25519",
  "open log ................. rfc6962",
  "ready",
];

export function BootSequence() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem("f-booted")) return;
      sessionStorage.setItem("f-booted", "1");
    } catch {
      return;
    }
    setOn(true);
    const t = setTimeout(() => setOn(false), 1600);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="f-boot" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {LINES.map((l, i) => (
        <div key={l} style={{ animation: `f-fade 0.01s linear ${0.15 + i * 0.18}s reverse both` }}>
          {l}
        </div>
      ))}
    </div>
  );
}
