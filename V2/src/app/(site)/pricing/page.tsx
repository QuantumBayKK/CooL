import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  Container,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "CooL's SDK and verifier are Apache-2.0 and free forever. Pilots are scoped conversations, not a checkout. What each tier includes, stated honestly.",
  alternates: { canonical: "/pricing" },
};

/**
 * Pricing.
 *
 * There are no prices on this page, and the page says so in the first sentence
 * rather than making the reader scroll to discover it.
 *
 * The reason is the readiness ladder: at Stage 0 there is no product to sell on
 * a self-serve plan, and a pricing table with numbers on it would be an implicit
 * claim of a maturity that does not exist. A published price for something that
 * cannot yet be bought is the same category of error as a green attestation
 * badge on a simulated quote.
 */
const TIERS = [
  {
    name: "SDK & verifier",
    price: "Free, forever",
    sub: "Apache-2.0",
    description:
      "The evidence plane, the CLI and the offline verifier. No account, no key, no telemetry.",
    cta: { label: "Read the quickstart", href: "/docs/quickstart" },
    featured: false,
    includes: [
      "Deterministic records and hybrid post-quantum signing",
      "RFC 6962 transparency log",
      "Offline verifier, seven domains",
      "Receipt and audit-pack export",
      "Published conformance vectors",
    ],
    excludes: ["Support commitment", "Hosted control plane"],
  },
  {
    name: "Design partner",
    price: "Scoped, not listed",
    sub: "Non-production pilot",
    description:
      "A scoped pilot in your sandbox, run with us. We are looking for a small number of teams who want this to exist and will tell us where it breaks.",
    cta: { label: "Start the conversation", href: "/contact?topic=pilot" },
    featured: true,
    includes: [
      "Everything in the SDK tier",
      "Reference integration for one language or CI system",
      "Direct line to the people who wrote it",
      "Your requirements shape Gate 2",
    ],
    excludes: [
      "Production deployment",
      "Uptime or support SLA",
      "Certifications — see the readiness ladder",
    ],
  },
  {
    name: "Enterprise",
    price: "Not yet available",
    sub: "Gate 2 and beyond",
    // claim-exempt:start
    // This tier exists to say what we do NOT have. Listing the Gate-2
    // capabilities under a heading that reads "Not yet available" is a
    // disclosure, not a claim — but the scanner matches phrases, not intent.
    description:
      "Single-tenant in your VPC or on-prem, SSO, HSM-sealed keys and external witnesses. This is real work that is not finished, and we would rather say so than take a deposit against it.",
    // claim-exempt:end
    cta: { label: "See what is missing", href: "/security/readiness" },
    featured: false,
    includes: [
      "Everything above, when it exists",
      "Control-plane / data-plane split, verified",
      "Helm chart, VPC and on-prem installs",
      "SAML 2.0 and OIDC, RBAC, MFA",
    ],
    excludes: [
      "Available today — it is not",
      "A date we are willing to commit to yet",
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Pricing"
            title="No prices on this page, and here is why."
            lead="At Stage 0 there is nothing to sell on a self-serve plan. A pricing table with numbers on it would imply a maturity the product does not have — the same category of error as a green badge over a simulated attestation. The SDK is free and always will be; everything else is a conversation."
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-px bg-line lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={
                  tier.featured
                    ? "flex flex-col bg-canvas p-7 ring-1 ring-inset ring-accent/30"
                    : "flex flex-col bg-canvas p-7"
                }
              >
                <div className="flex items-center gap-2.5">
                  <h2 className="text-h4">{tier.name}</h2>
                  {tier.featured && (
                    <StatusBadge status="accent" glyph={false}>
                      open now
                    </StatusBadge>
                  )}
                </div>

                <p className="mt-4 text-h3 text-ink">{tier.price}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.06em] text-ink-subtle">
                  {tier.sub}
                </p>

                <p className="mt-4 text-sm text-ink-muted">{tier.description}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-ok"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="text-sm text-ink-muted">{item}</span>
                      <span className="sr-only">included</span>
                    </li>
                  ))}
                  {tier.excludes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Minus
                        className="mt-0.5 size-3.5 shrink-0 text-ink-subtle"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="text-sm text-ink-subtle">{item}</span>
                      <span className="sr-only">not included</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-7"
                  variant={tier.featured ? "primary" : "secondary"}
                >
                  <Link href={tier.cta.href}>{tier.cta.label}</Link>
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="When there are prices"
            title="What we will charge for, and what we will not."
          />
          <div className="mt-10 grid gap-px bg-line sm:grid-cols-2">
            {[
              {
                t: "The verifier stays free",
                b: "Permanently, and Apache-2.0. Charging for the ability to check our own evidence would make the evidence worthless — the whole argument is that verification does not depend on us.",
              },
              {
                t: "The SDK stays free",
                b: "Same reasoning. If producing a record required a licence, the record would only prove that someone paid us.",
              },
              {
                t: "We will charge for the control plane",
                b: "Orchestration, the console, connectors, retention, support. The operational product, not the cryptography.",
              },
              {
                t: "We will not charge per record",
                b: "Metering evidence creates a direct incentive to record less, which is the opposite of what the product is for.",
              },
            ].map((row) => (
              <div key={row.t} className="bg-canvas p-6">
                <h3 className="text-h4">{row.t}</h3>
                <p className="mt-2 text-sm text-ink-muted">{row.b}</p>
              </div>
            ))}
          </div>

          <Card className="mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[62ch] text-sm text-ink-muted">
              If you need pricing to plan a budget, tell us what you are trying
              to size and we will give you a straight answer about what is
              realistic and when.
            </p>
            <Button asChild className="shrink-0">
              <Link href="/contact?topic=pricing">Ask us</Link>
            </Button>
          </Card>
        </Container>
      </Section>
    </>
  );
}
