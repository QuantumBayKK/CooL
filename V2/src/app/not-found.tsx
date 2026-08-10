import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { RESPONSE } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "That URL does not resolve. Here are the pages people are usually looking for, including the live demo and the offline verifier.",
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * Lives at the app root rather than inside the `(site)` group, because
 * `not-found.tsx` in a route group only catches misses *within* that group —
 * a URL matching no segment at all falls through to the root. That means this
 * file has to bring its own header and footer; there is no shell above it.
 *
 * `robots: index: false, follow: true` — the page must not be indexed, but the
 * links out of it should still be crawled, which is exactly what makes a 404
 * useful for recovering crawl paths rather than being a dead end.
 *
 * The content is a real set of destinations, not an apology and a home button.
 * Someone who lands here followed a broken or half-remembered URL, and the
 * fastest recovery is a short list of the things this site actually has.
 */

const DESTINATIONS = [
  {
    href: "/",
    title: "The demo",
    body: "Watch one AI change get sealed and verified — real cryptography, in your browser.",
  },
  {
    href: "/verify",
    title: "Verify a record",
    body: "Run the offline verifier yourself, and try to forge a receipt past it.",
  },
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    body: "Install the SDK and seal your first change.",
  },
  {
    href: "/security/readiness",
    title: "Readiness ladder",
    body: "Exactly which rung the product is on, and what is still simulated.",
  },
  {
    href: "/pricing",
    title: "Pricing",
    body: "What is open and free, and what the commercial product covers.",
  },
  {
    href: "/contact",
    title: "Contact",
    body: RESPONSE.short,
  },
] as const;

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container>
          <div className="py-20 lg:py-28">
            <Eyebrow>Error 404</Eyebrow>
            <h1 className="mt-4 max-w-[18ch] text-display">
              That page does not exist.
            </h1>
            <p className="mt-5 max-w-[54ch] text-lead text-ink-muted">
              The link may be out of date, or the address mistyped. Nothing has
              been lost — here is everything this site actually has.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/">
                  Back to the start
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/docs">Search the docs</Link>
              </Button>
            </div>

            <div className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
              {DESTINATIONS.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group bg-canvas p-6 transition-colors duration-[--duration-state] hover:bg-surface"
                >
                  <p className="flex items-center gap-2 text-h4 text-ink">
                    {d.title}
                    <ArrowRight
                      aria-hidden
                      className="size-4 text-ink-subtle transition-transform duration-[--duration-state] group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </p>
                  <p className="mt-2 text-sm text-ink-muted">{d.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
