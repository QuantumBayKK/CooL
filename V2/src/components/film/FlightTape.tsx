"use client";

import { useEffect, useState } from "react";

/**
 * The flight tape: a 48px event stream between sections.
 *
 * Every field name is the real cool.receipt.v1 schema; every value is an
 * illustrative example, and the accessible text says so. No hash on the tape
 * is presented as evidence of anything. The stream pauses on hover, on the
 * pause control (WCAG 2.2.2), and never moves under reduced motion.
 */
const EVENTS = [
  ["change.kind", "prompt"],
  ["ref", "billing/refund-agent#system"],
  ["sig.alg", "ml-dsa-65+ed25519"],
  ["log", "rfc6962"],
  ["change.kind", "model"],
  ["verdict.binding", "pass"],
  ["verdict.anchor", "absent"],
  ["change.kind", "tool.grant"],
  ["runtime.mode", "intel-tdx"],
  ["verdict.inclusion", "pass"],
  ["change.kind", "policy"],
  ["schema", "cool.receipt.v1"],
] as const;

export function FlightTape() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);
  const items = [...EVENTS, ...EVENTS];
  return (
    <div className="f-tape-wrap" style={{ position: "relative" }}>
      <p className="f-sr">
        Illustrative event stream showing receipt field names. The values are examples, not real evidence.
      </p>
      <div className="f-tape" aria-hidden="true" data-paused={paused}>
        <div className="f-tape__track">
          {items.map(([k, v], i) => (
            <span key={i}>
              <b>{k}</b> = {v} <span aria-hidden="true">·</span> example
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="f-label"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: 48,
          padding: "0 16px",
          background: "var(--k)",
          border: 0,
          borderLeft: "1px solid var(--w-24)",
          color: "var(--w)",
          cursor: "pointer",
        }}
      >
        {paused ? "▶ Play tape" : "❚❚ Pause tape"}
      </button>
    </div>
  );
}
