import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { CodeBlock } from "@/components/ui/code";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import {
  Card,
  Container,
  Eyebrow,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import { CaseStudy } from "@/components/marketing/CaseStudy";
import { Faq, FaqJsonLd } from "@/components/marketing/Faq";
import { Reviews } from "@/components/marketing/Reviews";
import { ActDashboard } from "@/components/trailer/ActDashboard";
import { ActReceipt } from "@/components/trailer/ActReceipt";
import { ActThread } from "@/components/trailer/ActThread";
import { Hero } from "@/components/trailer/Hero";
import { TimeSaved } from "@/components/trailer/TimeSaved";
import { CURRENT_STAGE } from "@/content/gates";
import { SITE } from "@/lib/site";

/**
 * The landing page, as a trailer.
 *
 * ── the shape ──
 *
 *   curtain → hero → 01 install → 02 the record → 03 console & reports
 *           → 04 what it costs you now → the live demo → the caveats → start
 *
 * Three pinned acts carry the product story with motion, and then the page
 * stops moving and starts proving. That ordering is the whole argument of the
 * design: the acts earn enough attention to get the reader to the demo, and the
 * demo is the only thing on the page that is not a claim — it runs the real
 * ML-DSA-65 signatures and the real Merkle log on the reader's own machine.
 *
 * ── what survived the rebuild, and why ──
 *
 * `<WhatIsNotTrue />` stays, immediately after the demo. A trailer is a format
 * built to oversell, and this site's entire position is that it can be checked
 * rather than believed — so the section listing the two things the product
 * cannot prove yet has to sit inside the polish, not on a page the polish links
 * to. A caveat that gets quietly dropped during a visual pass is precisely the
 * behaviour CooL exists to make detectable.
 *
 * ── cost ──
 *
 * The three acts are client components and the demo is a five-view crypto
 * workload, so nothing but the acts is eagerly loaded: `DemoShell` is
 * `dynamic()`, and it in turn code-splits four of its five views. The hero,
 * the caveats and the CTA are server-rendered — the reader gets readable HTML
 * before any of the motion code arrives.
 */

const DemoShell = dynamic(() => import("@/components/demo/DemoShell"));

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />

      <ActThread />
      <ActReceipt />
      <ActDashboard />
      <TimeSaved />

      <LiveDemoSection />
      <CaseStudy />
      <WhatIsNotTrue />
      {/* Renders nothing until there are real, attributed quotes. See the note
          on `REVIEWS` in content/marketing.ts. */}
      <Reviews />
      <Faq />
      <CallToAction />

      {/* Structured data. Both are `application/ld+json`, which is inert data
          rather than executable script, so neither needs a CSP nonce. */}
      <FaqJsonLd />
      <OrganisationJsonLd />
    </>
  );
}

/**
 * `Organization` + `WebSite` structured data.
 *
 * The pair Google actually uses on a homepage: `Organization` is what backs a
 * knowledge panel and makes the logo and social profiles attributable, and
 * `WebSite` establishes the canonical name so results stop being labelled with
 * a guess derived from the domain.
 *
 * No `aggregateRating`, deliberately — see the note in `Reviews.tsx`. Marking
 * up self-authored praise as a rating is the pattern that earns a manual
 * action, and there are no customer reviews to aggregate in any case.
 */
function OrganisationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}#organisation`,
        name: SITE.company,
        alternateName: SITE.name,
        url: SITE.url,
        description: SITE.description,
        logo: `${SITE.url}/icon.svg`,
        foundingDate: "2026",
        sameAs: [SITE.repo, SITE.npm],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: "info.quantumbay@gmail.com",
          url: `${SITE.url}/contact`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.url}#organisation` },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        description: SITE.description,
        url: SITE.url,
        publisher: { "@id": `${SITE.url}#organisation` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── the demo ─────────────────────────────────────────────────────────────── */

/**
 * The handoff from trailer to product.
 *
 * Everything above this line is drawn. Everything below it executes: the same
 * SDK that is published on npm, running in the reader's browser, with no server
 * involved. The section header says so plainly, because the transition from
 * "animation of a pipeline" to "the actual pipeline" is the single most
 * valuable moment on the page and it is worth one sentence to make sure nobody
 * scrolls past thinking it is more artwork.
 */
function LiveDemoSection() {
  return (
    <section id="demo" className="border-t border-line" data-surface="console">
      <Container>
        <div className="py-16 lg:py-20">
          <Reveal>
            <SectionHeader
              eyebrow="05 — Live, on your machine"
              title="Everything above was drawn. This part runs."
              lead="Real deterministic CBOR, real SHA-256 commitments, real ML-DSA-65 + Ed25519 signatures and a real RFC 6962 log — executing in this tab, with no server involved. Then forge the receipt and watch the same verifier reject it."
            />
          </Reveal>

          <div className="mt-10">
            <DemoShell />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── the honesty section ──────────────────────────────────────────────────── */

function WhatIsNotTrue() {
  const stage = CURRENT_STAGE;
  const real = stage.groups[0]?.items ?? [];
  const notReal = stage.groups[1]?.items ?? [];

  return (
    <Section tone="surface" id="honest">
      <Container>
        <SectionHeader
          eyebrow="06 — Where we actually are"
          title="The two things this cannot prove yet."
          lead="Listed here rather than buried, because a vendor who hides its gaps has told you nothing reliable about its strengths. Both are enforced in the verifier — no amount of presentation makes them go green."
        />

        <div className="mt-12 grid gap-px bg-line lg:grid-cols-2">
          <div className="bg-canvas p-7">
            <Eyebrow>Real today</Eyebrow>
            <ul className="mt-5 flex flex-col gap-4">
              {real.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-ok"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm text-ink">{item.label}</p>
                    {item.note && (
                      <p className="mt-1 text-xs text-ink-subtle">{item.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-canvas p-7">
            <Eyebrow>Not real today</Eyebrow>
            <ul className="mt-5 flex flex-col gap-4">
              {notReal.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <Minus
                    className="mt-0.5 size-4 shrink-0 text-ink-subtle"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm text-ink">{item.label}</p>
                    {item.note && (
                      <p className="mt-1 text-xs text-ink-subtle">{item.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Reveal>
          <Card className="mt-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[62ch] text-sm text-ink-muted">
              We publish a four-rung readiness ladder and the exact sentence we
              are allowed to say at each rung. A build that contains a phrase
              from a rung above the one we are on fails CI.
            </p>
            <Button asChild variant="secondary" className="shrink-0">
              <Link href="/security/readiness">
                See the ladder
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </Card>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ── CTA ──────────────────────────────────────────────────────────────────── */

function CallToAction() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col items-start gap-6">
          <SectionHeader
            eyebrow="07 — Start"
            title="Don't trust it. Check it."
            lead="Install the verifier, take a receipt this site produced in your browser, and run it on your own machine with the network off."
          />
          <CodeBlock
            className="w-full max-w-[44rem]"
            lang="bash"
            code={`npm install -g cool-nwc
cool verify ./change-receipt.json --offline`}
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/verify">
                Produce a receipt now
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
