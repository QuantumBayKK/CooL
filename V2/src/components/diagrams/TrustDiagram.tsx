import { Figure } from "@/components/diagrams/primitives";

/**
 * Who you still have to trust.
 *
 * Drawn as concentric reduction rather than as a stack, because the point is
 * subtractive: each mechanism removes a party from the set you must trust, and
 * what remains at the centre is the honest residue.
 *
 * The right-hand column is the one that matters and it is deliberately not
 * empty. A trust diagram with nothing left to trust is a diagram nobody
 * believes.
 */
const ROWS: readonly {
  party: string;
  removedBy: string | null;
  status: "removed" | "remaining";
  note: string;
}[] = [
  {
    party: "CooL, for record contents",
    removedBy: "Offline verifier + published spec",
    status: "removed",
    note: "You recompute every digest and signature yourself. We cannot alter a record you already hold.",
  },
  {
    party: "CooL, for signing keys",
    removedBy: "Measurement-derived keys",
    status: "removed",
    note: "No escrow. We have no copy to surrender, and no code path that would produce one.",
  },
  {
    party: "The network",
    removedBy: "Offline verification",
    status: "removed",
    note: "Verification makes zero network calls, and the count is measured rather than claimed.",
  },
  {
    party: "CooL, for log history",
    removedBy: "External witnesses — NOT BUILT",
    status: "remaining",
    note: "A log signed only by its operator is not tamper-evident against that operator. This is the honest gap, and it is Gate 2.",
  },
  {
    party: "The hardware vendor",
    removedBy: "Nothing — irreducible",
    status: "remaining",
    note: "A TEE attestation roots in Intel's signing key. If you do not trust the vendor, attestation proves nothing to you. No design removes this.",
  },
  {
    party: "Your own operators",
    removedBy: "Nothing — by design",
    status: "remaining",
    note: "CooL records what your people did. It does not prevent them doing it, and it was never intended to.",
  },
];

export function TrustDiagram() {
  return (
    <Figure
      label="Trust reduction table. Three parties are removed from the trust set by the offline verifier, measurement-derived keys and offline verification. Three remain: CooL for log history until external witnesses exist, the hardware vendor which is irreducible, and the customer's own operators by design."
      caption={
        <>
          Three parties removed, three remaining. The remaining column is not
          empty and will never be — a system claiming zero residual trust is
          claiming something no system achieves.
        </>
      }
    >
      <svg
        viewBox="0 0 900 340"
        className="h-auto w-full"
        role="img"
        aria-label="Who you still have to trust, drawn as a subtraction: each mechanism removes a party from the set. Signatures remove the operator, the transparency log removes CooL's ability to rewrite history, and offline verification removes the need to trust this website. What remains at the centre is the honest residue — the hardware vendor and the cryptographic primitives themselves."
      >
        {/* header rules */}
        <line x1="0" y1="28" x2="900" y2="28" className="stroke-line-strong" strokeWidth="1" />
        {["Party", "Removed by", "Status"].map((h, i) => (
          <text
            key={h}
            x={[16, 330, 730][i]}
            y={20}
            className="fill-ink-subtle text-[10px] uppercase"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          >
            {h}
          </text>
        ))}

        {ROWS.map((row, i) => {
          const y = 28 + i * 51;
          const remaining = row.status === "remaining";
          return (
            <g key={row.party}>
              {remaining && (
                // A wash behind the rows that still require trust, so the eye
                // lands on them first. This is the half of the table people
                // skip, and it is the half that is worth reading.
                <rect
                  x="0"
                  y={y}
                  width="900"
                  height="51"
                  className="fill-warn-wash"
                />
              )}
              <line
                x1="0"
                y1={y + 51}
                x2="900"
                y2={y + 51}
                className="stroke-line"
                strokeWidth="1"
              />

              <text
                x={16}
                y={y + 21}
                className="fill-ink text-[12px]"
                style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
              >
                {row.party}
              </text>
              <text
                x={16}
                y={y + 38}
                className="fill-ink-subtle text-[10.5px]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {row.note}
              </text>

              <text
                x={330}
                y={y + 21}
                className={remaining ? "fill-warn text-[11px]" : "fill-ink-muted text-[11px]"}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {row.removedBy}
              </text>

              {/* Glyph plus word — status is never colour alone. */}
              <text
                x={730}
                y={y + 21}
                className={remaining ? "fill-warn text-[11px]" : "fill-ok text-[11px]"}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {remaining ? "!  still trusted" : "✓  removed"}
              </text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}
