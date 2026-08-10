import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { FAQS, RESPONSE } from "@/content/marketing";

/**
 * The FAQ.
 *
 * Native `<details>`/`<summary>`, not a JavaScript accordion. Three things
 * come free with the element and all three are otherwise work: it is keyboard
 * operable and correctly announced with no ARIA at all, it opens without
 * hydration so the answers are readable the instant the HTML lands, and — the
 * one that matters most here — browser find-in-page can search inside a closed
 * `<details>` and open it. A div-based accordion hides its answers from Ctrl-F,
 * which on an FAQ is the single most likely way a reader looks for an answer.
 *
 * The same five answers are emitted as `FAQPage` structured data by
 * `<FaqJsonLd />` below, from the same array, so the rich result and the page
 * cannot drift.
 */
export function Faq({ heading = "Questions people actually ask" }: { heading?: string }) {
  return (
    <section id="faq" className="section-y border-t border-line">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 text-h2">{heading}</h2>
            <p className="mt-4 text-body text-ink-muted">{RESPONSE.short}</p>
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/contact">
                Ask us something else
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </div>

          <dl className="border-t border-line">
            {FAQS.map((item) => (
              <details
                key={item.q}
                name="faq"
                className="group border-b border-line"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-h4 marker:content-none [&::-webkit-details-marker]:hidden">
                  <dt>{item.q}</dt>
                  {/* A plus that becomes a minus. Two spans rather than a
                      rotating glyph: a rotated "+" lands on a "×", which reads
                      as dismiss rather than as collapse. */}
                  <span
                    aria-hidden
                    className="relative mt-1 size-4 shrink-0 text-ink-subtle"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-opacity duration-[--duration-state] group-open:opacity-0" />
                  </span>
                </summary>
                <dd className="max-w-[62ch] pb-5 text-body text-ink-muted">
                  {item.a}
                </dd>
              </details>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

/**
 * `FAQPage` structured data.
 *
 * Emitted from the same `FAQS` array the visible copy uses. Google's guidance
 * is explicit that structured data must match what the user sees; generating
 * both from one source is the only way to guarantee that as the copy changes.
 *
 * Rendered from a Server Component, so this is static HTML in the document —
 * no nonce needed and nothing for the CSP to block, because `application/ld+json`
 * is data rather than an executable script.
 */
export function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
