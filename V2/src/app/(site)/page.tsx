import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Hero } from "@/components/home/Hero";
import {
  Benefits,
  CallToAction,
  Domains,
  Founders,
  Landscape,
  Market,
  PositionSection,
  Product,
  Roadmap,
  Standing,
  WhyNow,
} from "@/components/home/sections";
import { CaseStudy } from "@/components/marketing/CaseStudy";
import { Faq, FaqJsonLd } from "@/components/marketing/Faq";
import { Reviews } from "@/components/marketing/Reviews";
import { Container, SectionHeader } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";

/**
 * The landing page.
 *
 * ── the shape ──
 *
 *   hero + verdict panel → 01 why now → 02 product → 03 verification domains
 *        → the live demo → 04 what it gets you → worked example
 *        → 05 landscape → 06 position → 07 market → 08 where we actually are
 *        → 09 founders → 10 roadmap → FAQ → start
 *
 * A document, not a trailer. The previous version of this page opened with a
 * centred headline and three pinned scroll acts — several viewport-heights of
 * animation each — and the demo, the most persuasive thing the company has,
 * began 15,800px down. It was rebuilt as a dense sectioned page in the shape
 * developer-infrastructure buyers actually read: numbered bands, hairline
 * grids, a comparison matrix, and every claim next to the artefact that
 * supports it.
 *
 * The three trailer acts still exist in `components/trailer/` and are no longer
 * mounted anywhere. They were not deleted: they are working, tested scroll
 * choreography, and the decision to stop using them on the homepage is a
 * layout decision rather than a judgement that the code is wrong.
 *
 * ── the ordering rule ──
 *
 * Sceptic-first. The regulatory case, the pipeline and the honest verdict table
 * all come before the demo; the market, the founders and the roadmap come
 * after. Someone evaluating this product decides whether the cryptography is
 * real long before they care who built it, and a page that opens with the team
 * is a page that has misread its own reader.
 *
 * ── cost ──
 *
 * Everything above is a Server Component and ships no JavaScript. `DemoShell`
 * is the single client island — `dynamic()`, and it code-splits four of its
 * five views internally — so the reader gets the whole argument as readable
 * HTML before any crypto workload arrives.
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

      <WhyNow />
      <Product />
      <Domains />

      <LiveDemoSection />

      <Benefits />
      <CaseStudy />

      <Landscape />
      <PositionSection />
      <Market />
      <Standing />
      <Founders />
      <Roadmap />

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

/* ── the demo ─────────────────────────────────────────────────────────────── */

/**
 * The handoff from argument to artefact.
 *
 * Everything above this line is a claim. Everything inside it executes: the
 * same SDK published on npm, running in the reader's browser, with no server
 * involved. It sits directly under the verdict table on purpose — a reader who
 * has just been told that five of seven domains are real is, at that exact
 * moment, wondering whether to believe it, and this is the section that lets
 * them check without leaving the page.
 *
 * `data-surface="console"` demotes red to "failure only" inside this band; see
 * the note at the top of `globals.css`. The demo's primary controls become
 * ink-filled so that the only red in the section is a rejected receipt.
 */
function LiveDemoSection() {
  return (
    <section
      id="demo"
      className="border-t border-line bg-surface"
      data-surface="console"
    >
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeader
            eyebrow="Live — on your machine"
            title="Everything above is a claim. This part runs."
            lead="Real deterministic CBOR, real SHA-256 commitments, real ML-DSA-65 + Ed25519 signatures and a real RFC 6962 log — executing in this tab, with no server involved. Then forge the receipt and watch the same verifier reject it."
          />

          <div className="mt-10">
            <DemoShell />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── structured data ──────────────────────────────────────────────────────── */

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
