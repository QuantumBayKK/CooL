import type { Metadata } from "next";
import Link from "next/link";

import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { PipelineDiagram } from "@/components/diagrams/PipelineDiagram";
import { TrustDiagram } from "@/components/diagrams/TrustDiagram";
import { Button } from "@/components/ui/button";
import {
  Container,
  DataList,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/primitives";
import { LAYERS, TOPOLOGIES } from "@/content/investors";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "Where each part of CooL runs, which trust boundary it sits behind, and what crosses between them. Control plane and data plane, deployment topologies, and the failure model.",
  alternates: { canonical: "/architecture" },
};

export default function ArchitecturePage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Architecture"
            title="Where each part runs, and what crosses the line."
            lead="One architectural decision does most of the work: the control plane is ours and the data plane is yours. Everything else follows from refusing to move evidence across that boundary."
          />
          <div className="mt-10">
            <ArchitectureDiagram />
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="The layers"
            title="Every component, and whose environment it lives in."
          />
          <ul className="mt-10 border-t border-line">
            {LAYERS.map((layer) => (
              <li
                key={layer.name}
                className="grid gap-2 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h2 className="text-h4">{layer.name}</h2>
                    <span className="font-mono text-xs text-ink-subtle">
                      {layer.stack}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-[70ch] text-sm text-ink-muted">
                    {layer.does}
                  </p>
                </div>
                <StatusBadge
                  status={
                    layer.zone === "Customer environment" ? "accent" : "neutral"
                  }
                  className="justify-self-start sm:justify-self-end"
                >
                  {layer.zone === "Customer environment" ? "yours" : "ours"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Trust"
            title="Who has to be honest for this to work."
            lead="The useful question about any evidence system is not what it proves but who it still requires you to trust. Here is the honest answer, including the parts that are uncomfortable."
          />
          <div className="mt-10">
            <TrustDiagram />
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="Failure model"
            title="What happens when something breaks."
            lead="An infrastructure product is bought or rejected on this table more than on any feature."
          />
          <DataList
            className="mt-10"
            rows={[
              {
                label: "CooL is unreachable",
                value:
                  "Your inference is unaffected — capture is never in that path. Events queue; what cannot be queued is counted, and the count is written as a signed entry so loss is recorded rather than silent.",
              },
              {
                label: "The capture agent crashes",
                value:
                  "Your application keeps serving. Capture is out-of-band and non-throwing by construction: the call is an array push.",
              },
              {
                label: "The enclave measurement changes",
                value:
                  "A different signing key is derived, and receipts pinned to the old measurement stop verifying against the new one. That is the intended alarm, not a bug.",
              },
              {
                label: "RA-TLS peer fails attestation",
                value:
                  "The channel never opens and nothing is transmitted. Fail-closed toward the network, fail-open toward your application.",
              },
              {
                label: "The log operator misbehaves",
                value:
                  "Detectable by an external witness — which is not built. Today, against a determined insider at CooL, the log alone is not sufficient. This is Gate 2 and it is not claimed.",
              },
              {
                label: "A signing algorithm is broken",
                value:
                  "Records carry ML-DSA-65 and Ed25519, both required. A break in one family does not forge a record.",
              },
            ]}
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Deployment"
            title="One artifact, three topologies."
            lead="The same package runs all three. We never fork the product per customer — the thing that quietly kills enterprise infrastructure startups."
          />
          <div className="mt-10 grid gap-px bg-line sm:grid-cols-3">
            {TOPOLOGIES.map((t) => (
              <div key={t.name} className="bg-canvas p-6">
                <h2 className="text-h4">{t.name}</h2>
                <p className="mt-1.5 text-xs text-ink-subtle">{t.who}</p>
                <p className="mt-3 text-sm text-ink-muted">{t.how}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <SectionHeader
              eyebrow="The evidence path"
              title="And here it is again, at the record level."
            />
            <div className="mt-8">
              <PipelineDiagram />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/verify">Verify a record yourself</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/security">Read the security model</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
