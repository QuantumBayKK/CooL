import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { StickyCta } from "@/components/landing/StickyCta";
import {
  Contact,
  FAQ,
  Faq,
  Footer,
  Hero,
  How,
  Pricing,
  Problem,
  Proof,
} from "@/components/landing/Sections";
import { CONTACT, HAS_PHONE } from "@/lib/contact";
import { SITE } from "@/lib/site";

/**
 * The homepage.
 *
 * Rebuilt phone-first, and rebuilt as a page rather than a deck. The eleven
 * snap-scrolled slides moved to `/deck`, where they are still exactly right for
 * presenting; they were the wrong shape for the job this URL has to do, for
 * three reasons that all point the same way.
 *
 * Snap scrolling fights a thumb. A phone reader flicks and expects to land
 * where physics says; a page that yanks each gesture to a slide boundary feels
 * broken rather than designed, and the fix the deck already carries is to
 * disable snapping on coarse pointers — which is an admission that the format
 * was not built for the device most people arrive on.
 *
 * Content that animates in from `opacity: 0` is content a crawler does not see.
 * Every word here is server-rendered with no client boundary, so the HTML that
 * arrives is the HTML that gets read and indexed. The only JavaScript on the
 * route is the thumb bar.
 *
 * And the deck cost 255 kB of Three.js on first load to draw an object nobody
 * came for. Removing it from this route is the single largest thing that could
 * be done for a phone on a slow connection, which is the visitor this page is
 * now written for.
 */
export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description:
    "CooL documents, approves and cryptographically seals every change your teams make to their AI — prompts, models, agent permissions — automatically. Audit evidence that is provable years later, with no manual work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Every AI change, documented and provable — without anyone writing it up",
    description:
      "Your teams change AI every day. Each change is supposed to be written up, approved and filed. CooL does all of it automatically, and seals it so it can be proved later.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Every AI change, documented and provable",
    description:
      "Automatic AI governance evidence, sealed in a TEE and verifiable offline by anyone.",
  },
};

/**
 * Page-level structured data.
 *
 * The FAQ entries come from the same constant the page renders, so the markup
 * and the visible text cannot drift — Google penalises FAQ structured data that
 * does not appear on the page, and the usual cause is exactly that drift.
 *
 * `ContactPoint` is emitted only when a real number is configured. Advertising
 * a telephone in structured data that nobody answers is worse than omitting it.
 */
function PageSchema() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      ...(HAS_PHONE
        ? [
            {
              "@type": "ContactPoint",
              "@id": `${SITE.url}/#sales`,
              contactType: "sales",
              telephone: CONTACT.phone,
              email: CONTACT.email,
              areaServed: "Worldwide",
              availableLanguage: ["en"],
            },
          ]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Static, developer-authored JSON — no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function Page() {
  return (
    <>
      <PageSchema />
      <LandingNav />

      {/* Bottom padding clears the thumb bar so the last line of the footer is
          never sitting underneath it on a phone. */}
      <main className="relative pb-24 md:pb-0">
        <Hero />
        <Problem />
        <How />
        <Proof />
        <Pricing />
        <Faq />
        <Contact />
      </main>

      <Footer />
      <StickyCta />
    </>
  );
}
