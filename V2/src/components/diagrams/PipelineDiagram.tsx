import { Arrow, ArrowDefs, Box, Boundary, Figure } from "@/components/diagrams/primitives";

/**
 * The evidence pipeline, left to right.
 *
 * Two things this diagram is drawn to make unmissable:
 *
 *   1. Inference and capture are on separate paths. The arrow from the app to
 *      the model does not pass through CooL, which is the visual form of "never
 *      in the critical path". If CooL is down, that top arrow is unaffected.
 *
 *   2. Verification happens outside the trust boundary. The verifier box sits
 *      deliberately outside the dashed enclave region, because a verifier
 *      inside the thing it is verifying proves nothing.
 */
export function PipelineDiagram() {
  return (
    <Figure
      label="Evidence pipeline: an application's inference path runs directly to the model, while a separate asynchronous capture path commits, binds, signs and logs a record inside the enclave. The verifier runs outside the enclave boundary, offline."
      caption={
        <>
          The inference path (top) never passes through CooL. Capture is
          asynchronous and fail-open; the verifier sits outside the trust
          boundary on purpose.
        </>
      }
    >
      <svg viewBox="0 0 900 300" className="h-auto w-full">
        <ArrowDefs />

        {/* ── inference path — the one that must never be blocked ────────── */}
        <Box x={16} y={26} w={150} h={54} title="Your application" sub="unchanged" />
        <Box x={330} y={26} w={150} h={54} title="Model" sub="your provider" />
        <Arrow d="M 166 53 H 330" label="inference" labelX={248} labelY={45} />
        <Arrow d="M 480 66 H 174" label="completion" labelX={330} labelY={82} />

        {/* ── capture path ───────────────────────────────────────────────── */}
        <Arrow
          d="M 91 80 V 128"
          label=""
          tone="accent"
          dashed
        />
        <text
          x={99}
          y={110}
          className="fill-accent text-[10px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          capture (async, fail-open)
        </text>

        {/* ── the enclave ────────────────────────────────────────────────── */}
        <Boundary x={16} y={128} w={620} h={140} label="Enclave · your boundary" />

        <Box x={38} y={162} w={124} h={54} title="Commit" sub="canonical CBOR" tone="accent" />
        <Box x={186} y={162} w={124} h={54} title="Bind" sub="sha-256" tone="accent" />
        <Box x={334} y={162} w={124} h={54} title="Sign" sub="ML-DSA-65 + Ed25519" tone="accent" />
        <Box x={482} y={162} w={132} h={54} title="Append" sub="RFC 6962 log" tone="accent" />

        <Arrow d="M 162 189 H 186" tone="accent" />
        <Arrow d="M 310 189 H 334" tone="accent" />
        <Arrow d="M 458 189 H 482" tone="accent" />

        {/* Key derivation — the reason CooL cannot forge a customer's record. */}
        <Box x={334} y={92} w={124} h={30} title="Key from measurement" tone="muted" />
        <Arrow d="M 396 122 V 162" dashed />

        {/* ── outside the boundary ───────────────────────────────────────── */}
        <Box
          x={690}
          y={162}
          w={186}
          h={54}
          title="Verifier"
          sub="offline · not ours to control"
        />
        <Arrow d="M 614 189 H 690" label="receipt" labelX={652} labelY={181} />

        <text
          x={690}
          y={238}
          className="fill-ink-subtle text-[10px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          runs on your machine
        </text>

        {/* Attestation, honestly labelled. */}
        <Box
          x={690}
          y={92}
          w={186}
          h={44}
          title="Attestation"
          sub="simulated today"
          tone="warn"
        />
        <Arrow d="M 783 136 V 162" dashed />
      </svg>
    </Figure>
  );
}
