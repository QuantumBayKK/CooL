import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { Hero } from "@/components/home/Hero";
import {
  CallToAction,
  Domains,
  Landscape,
  Product,
  Standing,
  WhyNow,
} from "@/components/home/sections";
import { Faq, FaqJsonLd } from "@/components/marketing/Faq";
import { Reviews } from "@/components/marketing/Reviews";
import { Container, SectionHeader } from "@/components/ui/primitives";
import { LoadingPanel } from "@/components/ui/loader";
import { SITE } from "@/lib/site";

/**
 * The landing page.
 *
 * ── the shape ──
 *
 *   hero + verdict panel → 01 why now → 02 product → 03 verification domains
 *        → the live demo → 04 landscape → 05 where we actually are
 *        → FAQ → start
 *
 * Six bands and a demo. Two revisions got it here: first from a scroll trailer
 * whose three pinned acts put the demo 15,800px down the page, then from a
 * fifteen-band document that had every section a landing page can have. This
 * version has the ones that carry the argument and none of the ones that
 * restate it — see the note at the top of `components/home/sections.tsx` for
 * exactly what was cut and on what grounds.
 *
 * ── the ordering rule ──
 *
 * Sceptic-first. The regulatory case, the pipeline and the honest verdict table
 * all come before the demo; the comparison and the admission of what is missing
 * come after. Someone evaluating this product decides whether the cryptography
 * is real long before they care about anything else, and a page that opens with
 * the company has misread its own reader.
 *
 * ── cost ──
 *
 * Everything above is a Server Component and ships no JavaScript. `DemoShell`
 * is the single client island — `dynamic()`, code-splitting four of its five
 * views internally, with a loader while it arrives — so the reader gets the
 * whole argument as readable HTML before any crypto workload does.
 */

const DemoShell = dynamic(() => import("@/components/demo/DemoShell"), {
  loading: () => <LoadingPanel label="Loading the demo" className="min-h-[420px]" />,
});

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

      <Landscape />
      <Standing />

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
    <section id="demo" className="border-t border-line" data-surface="console">
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
