import type { Metadata } from "next";
import Link from "next/link";
import Backdrop from "@/components/Backdrop";
import { WhyStory } from "@/components/why/WhyStory";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Why this matters",
  description:
    "One line of a prompt changes in thirty seconds. What follows is the rest of somebody's afternoon — and, by the end of the year, three to four weeks of a team. This is the story of the work nobody chose, the question nobody can answer, and the deadline that cannot be backfilled.",
  alternates: { canonical: "/why" },
  openGraph: {
    title: "It is Monday, 09:14.",
    description:
      "Someone changes one line of a prompt. That part is over in thirty seconds. What follows is the rest of somebody's afternoon — and the reason CooL exists.",
    url: "/why",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "It is Monday, 09:14.",
    description:
      "The thirty seconds, the afternoon, the question nobody can answer, and the deadline you cannot backfill.",
  },
};

/**
 * The long read.
 *
 * The deck on `/` argues in eleven screens, one idea each, because that is what
 * works when somebody is presenting it live. This page is for the other case:
 * a reader alone with a link, at their own pace, who has asked the only
 * question that matters — why does this need to exist at all?
 *
 * That question is not answered by a feature list. It is answered by a story
 * about a Monday, and it takes as many words as it takes.
 */
export default function WhyPage() {
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "It is Monday, 09:14.",
    description: metadata.description,
    url: `${SITE.url}/why`,
    author: { "@type": "Organization", name: SITE.company },
    publisher: { "@type": "Organization", name: SITE.company },
    isPartOf: { "@type": "WebSite", url: SITE.url, name: SITE.name },
  };

  return (
    <>
      <Backdrop />
      {/* A scrim over the cipher field.
          The field is the site's signature and it works on the deck, where text
          is sparse and every slide is a headline. This page is four thousand
          words, and at full strength the field competes with every line of it —
          which turns a long read into hard work. Damping it keeps the identity
          while giving the prose solid ground to sit on. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] bg-void/[0.86] backdrop-blur-[3px]"
      />
      <div className="grain" aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <main className="relative z-10">
        <WhyStory />
      </main>

      <footer className="relative z-10 border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-mist">
          <Link href="/" className="transition-colors hover:text-ink">
            The deck
          </Link>
          <Link href="/demo" className="transition-colors hover:text-ink">
            Live demo
          </Link>
          <Link href="/dashboard" className="transition-colors hover:text-ink">
            The console
          </Link>
          <Link href="/investors" className="transition-colors hover:text-ink">
            Diligence
          </Link>
          <span className="ml-auto">{SITE.company}</span>
        </div>
      </footer>
    </>
  );
}
