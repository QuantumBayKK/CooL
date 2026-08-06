import type { Metadata } from "next";
import Link from "next/link";

import { PipelineDiagram } from "@/components/diagrams/PipelineDiagram";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code";
import {
  Container,
  Eyebrow,
  Mono,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "How CooL works",
  description:
    "Capture, commit, bind, sign, log, verify. The evidence pipeline stage by stage — what each step computes, and why it is there.",
  alternates: { canonical: "/technology" },
};

const STAGES = [
  {
    n: "01",
    name: "Capture",
    detail:
      "An SDK call, a CI hook or a gateway hook notices the change. The call is an array push: asynchronous, bounded and non-throwing. It cannot block your inference and it cannot fail it.",
    output: "ChangeEvent",
  },
  {
    n: "02",
    name: "Commit",
    detail:
      "The event is serialised as deterministic CBOR (CDE). Determinism is the load-bearing property — two implementations must produce identical bytes, or every digest downstream means nothing.",
    output: "canonical bytes",
  },
  {
    n: "03",
    name: "Bind",
    detail:
      "SHA-256 over the canonical bytes, producing the binding digest. This is what makes tampering detectable rather than merely unlikely.",
    output: "binding_digest",
  },
  {
    n: "04",
    name: "Sign",
    detail:
      "ML-DSA-65 and Ed25519 over canonicalCBOR(core) ‖ binding_digest. Both are required. A classical break does not forge a record, and neither does a lattice break.",
    output: "hybrid signature",
  },
  {
    n: "05",
    name: "Log",
    detail:
      "An RFC 6962 leaf, SHA256(0x00 ‖ digest), appended to the transparency log. The audit path proves position in history rather than asserting it.",
    output: "leaf + audit path",
  },
  {
    n: "06",
    name: "Verify",
    detail:
      "Anyone, offline, with a verifier we do not control. Seven domains, reported separately. Two of them do not pass today and say so.",
    output: "seven verdicts",
  },
] as const;

export default function TechnologyPage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="How CooL works"
            title="Six steps, and you can check the output of every one."
            lead="Nothing in this pipeline is novel cryptography. That is deliberate — the primitives are standard, published and boring, and the only interesting decision is what gets committed to and who is allowed to check it."
          />
          <div className="mt-10">
            <PipelineDiagram />
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="Stage by stage"
            title="What each step actually computes."
          />
          <ol className="mt-10 border-t border-line">
            {STAGES.map((stage) => (
              <li
                key={stage.n}
                className="grid gap-3 border-b border-line py-6 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,12rem)] sm:gap-8"
              >
                <span
                  className="font-mono text-xs text-ink-subtle"
                  data-numeric
                >
                  {stage.n}
                </span>
                <div>
                  <h2 className="text-h4">{stage.name}</h2>
                  <p className="mt-1.5 max-w-[68ch] text-sm text-ink-muted">
                    {stage.detail}
                  </p>
                </div>
                <div className="sm:text-right">
                  <Mono>{stage.output}</Mono>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── hybrid crypto ───────────────────────────────────────────────── */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
            <SectionHeader
              eyebrow="Post-quantum"
              title="Hybrid, never post-quantum alone."
              lead="Evidence has to outlive the machine that made it. A compliance record sealed today may need to be defensible in fifteen years — and a signature that becomes forgeable inside that window retroactively destroys every record it protected."
            />
            <div className="flex flex-col gap-6">
              <p className="max-w-[64ch] text-sm text-ink-muted">
                So every record carries two signatures: ML-DSA-65 (FIPS 204) and
                Ed25519. Both must verify. The reasoning is symmetric — the
                lattice schemes are young and could have an unpleasant surprise
                in them, and the classical schemes have a known expiry date
                against a cryptographically relevant quantum computer. Requiring
                both means a break in either family is survivable.
              </p>
              <p className="max-w-[64ch] text-sm text-ink-muted">
                The same reasoning applies to key exchange: ML-KEM with X25519,
                together.
              </p>
              <CodeBlock
                lang="text"
                filename="what gets signed"
                code={`message = canonicalCBOR(core) ‖ binding_digest

  sig_pq        = ML-DSA-65(message, sk_pq)
  sig_classical = Ed25519(message, sk_ed)

verify → both must pass, independently`}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* ── keys ────────────────────────────────────────────────────────── */}
      <Section tone="surface">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
            <SectionHeader
              eyebrow="Keys"
              title="There is no signing key to configure."
              lead="There cannot be one. It is derived inside the enclave from the measurement of the image that is running — which is exactly why CooL cannot forge a customer's records."
            />
            <div className="flex flex-col gap-5">
              <p className="max-w-[64ch] text-sm text-ink-muted">
                Change the image and you derive a different key. That is not a
                side effect; it is the property that makes a measurement
                meaningful. A pinned measurement plus a derived key means
                &ldquo;attested code&rdquo; and &ldquo;signing key&rdquo; are one
                chain rather than two claims that have to be correlated by
                trusting somebody.
              </p>
              <p className="max-w-[64ch] text-sm text-ink-muted">
                It also means there is no key escrow. We cannot produce a
                customer&apos;s signing key under legal compulsion, because we do
                not have one and the architecture gives us no way to obtain one.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="warn">
                  Today this runs against a simulator
                </StatusBadge>
                <Link
                  href="/security#simulated"
                  className="text-sm text-ink underline underline-offset-4"
                >
                  What that does and does not prove
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col items-start gap-6">
            <Eyebrow>Next</Eyebrow>
            <h2 className="text-h2 max-w-[22ch]">
              Watch it run, then try to break it.
            </h2>
            <p className="max-w-prose text-lead text-ink-muted">
              The pipeline page runs all six stages in your browser and then
              gives you four buttons that forge the receipt, so you can watch the
              verifier reject it and name the domain that failed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/pipeline">Open the pipeline</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/architecture">See the architecture</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
