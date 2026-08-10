import { Arrow, ArrowDefs, Box, Boundary, Figure } from "@/components/diagrams/primitives";

/**
 * Control plane / data plane split.
 *
 * The single most important thing this diagram has to communicate is that no
 * arrow carrying evidence crosses from the customer boundary into ours. Every
 * line that does cross carries orchestration — config, health, billing — and is
 * drawn dashed and labelled so the difference is visible rather than asserted.
 *
 * If someone redraws this and an evidence arrow crosses the boundary, the
 * architecture has changed and the security page needs rewriting. That is the
 * point of drawing it as a boundary rather than as two columns.
 */
export function ArchitectureDiagram() {
  return (
    <Figure
      label="Control plane and data plane. CooL's control plane handles orchestration, updates and billing. The customer's data plane holds the capture agent, evidence plane, transparency log and object store. Only orchestration and health signals cross the boundary; no evidence, prompt or PII leaves the customer environment."
      caption={
        <>
          Solid lines carry evidence and stay inside the customer boundary.
          Dashed lines cross it and carry only orchestration, health and
          billing — never a prompt, a record or a key.
        </>
      }
    >
      {/* The accessible name describes what the drawing PROVES, not what it
          contains. "A diagram with boxes and arrows" tells a screen-reader
          user nothing; the load-bearing fact — that no evidence arrow crosses
          the boundary — is the whole reason the diagram exists. */}
      <svg
        viewBox="0 0 900 400"
        className="h-auto w-full"
        role="img"
        aria-label="Architecture: the customer's data plane holds all evidence, prompts and personal data, while CooL's control plane holds only orchestration, health and billing. Every arrow crossing between them is dashed and carries configuration only — no arrow carrying evidence leaves the customer boundary."
      >
        <ArrowDefs />

        {/* ── our side ───────────────────────────────────────────────────── */}
        <Boundary x={16} y={20} w={250} h={200} label="CooL · control plane" />
        <Box x={40} y={54} w={202} h={44} title="Orchestration" sub="config, rollout" tone="muted" />
        <Box x={40} y={110} w={202} h={44} title="Updates & licensing" tone="muted" />
        <Box x={40} y={166} w={202} h={40} title="Billing" sub="usage counts only" tone="muted" />

        {/* ── customer side ──────────────────────────────────────────────── */}
        <Boundary x={330} y={20} w={554} h={356} label="Customer · VPC or on-prem · data plane" />

        <Box x={356} y={54} w={158} h={50} title="Your application" sub="unchanged" />
        <Box x={356} y={124} w={158} h={50} title="Capture agent" sub="async · fail-open" tone="accent" />

        <Box x={560} y={124} w={166} h={50} title="Evidence plane" sub="commit · bind · sign" tone="accent" />
        <Box x={560} y={196} w={166} h={50} title="Transparency log" sub="RFC 6962" tone="accent" />
        <Box x={560} y={268} w={166} h={50} title="Object store" sub="receipts, packs" tone="accent" />

        <Box x={766} y={196} w={98} h={50} title="Keys" sub="TEE-sealed" tone="warn" />

        {/* evidence flow, all inside the boundary */}
        <Arrow d="M 435 104 V 124" tone="accent" />
        <Arrow d="M 514 149 H 560" tone="accent" />
        <Arrow d="M 643 174 V 196" tone="accent" />
        <Arrow d="M 643 246 V 268" tone="accent" />
        <Arrow d="M 766 221 H 726" dashed />

        {/* ── the crossings — orchestration only ─────────────────────────── */}
        <Arrow
          d="M 266 76 H 356"
          dashed
          label="config"
          labelX={311}
          labelY={68}
        />
        <Arrow
          d="M 356 190 H 266"
          dashed
          label="health · counts"
          labelX={311}
          labelY={182}
        />

        {/* ── the auditor, outside everything ────────────────────────────── */}
        <Box x={356} y={268} w={158} h={50} title="Auditor" sub="offline verifier" />
        <Arrow d="M 560 293 H 514" label="receipt" labelX={537} labelY={285} />

        <text
          x={356}
          y={340}
          className="fill-ink-subtle text-[10px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          verifies without contacting CooL
        </text>
      </svg>
    </Figure>
  );
}
