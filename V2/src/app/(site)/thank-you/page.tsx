import type { Metadata } from "next";
import Link from "next/link";

import { SiteLink } from "@/components/shell/SiteLink";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { RESPONSE } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Thanks — we have your message",
  description:
    "Your enquiry reached both founders. We reply within one working day, IST. In the meantime, here is what is worth reading.",
  alternates: { canonical: "/thank-you" },
  // Not indexable: a confirmation page has no value in search results, and an
  // indexed one gets reached by people who never submitted anything, who are
  // then told their message was received. `follow` so the links still pass.
  robots: { index: false, follow: true },
};

/**
 * The post-enquiry page.
 *
 * A real destination rather than an inline "thanks!" under the form, for three
 * reasons that all matter:
 *
 * · **It is a measurable event.** A distinct URL is what makes "enquiry
 *   completed" a goal in analytics without writing a custom event, and without
 *   the false positives you get from counting button clicks.
 * · **It survives a refresh.** An inline success state vanishes if the reader
 *   reloads, leaving them unsure whether the message actually sent.
 * · **It is the highest-intent moment on the site.** Someone who just wrote to
 *   us is more likely to read the readiness ladder than at any other point, so
 *   this page spends that attention rather than dead-ending.
 *
 * It sets the expectation precisely — what happens next, by when, and from
 * whom — because the gap between submitting a form and hearing back is where
 * doubt about a two-person company grows.
 */

const NEXT = [
  {
    href: "/demo",
    title: "Run the demo while you wait",
    body: "Seal one AI change and verify it, with real cryptography in your browser. Then forge the receipt and watch the verifier reject it.",
  },
  {
    href: "/security/readiness",
    title: "Read what we cannot prove yet",
    body: "The four-rung readiness ladder, the rung we are actually on, and the exact sentences we are allowed to say at each one.",
  },
  {
    href: "/docs/quickstart",
    title: "Install the SDK",
    body: "npm install -g cool-nwc, seal a change, and check the receipt offline on your own machine.",
  },
] as const;

export default function ThankYouPage() {
  return (
    <>
      <Container>
        <div className="py-14 lg:py-20">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-ok-wash text-ok">
            <Check className="size-5" strokeWidth={2.5} aria-hidden />
          </span>

          <Eyebrow className="mt-6">Message received</Eyebrow>
          <h1 className="mt-4 max-w-[20ch] text-display">
            Thanks — that reached both founders.
          </h1>
          <p className="mt-5 max-w-[56ch] text-lead text-ink-muted">
            {RESPONSE.long}
          </p>

          <div className="mt-8 border-y border-line py-5">
            <dl className="grid gap-5 sm:grid-cols-3">
              {[
                ["Who reads it", "Pranauv and Kailosh, directly"],
                ["When you hear back", `Within ${RESPONSE.window}, IST (UTC+5:30)`],
                ["What we will ask", "What you are running, and what you need to prove"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-label uppercase text-ink-subtle">{k}</dt>
                  <dd className="mt-1.5 text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <h2 className="mt-14 text-h3">While you wait</h2>
          <div className="mt-6 grid gap-px bg-line sm:grid-cols-3">
            {NEXT.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="group bg-canvas p-6 transition-colors duration-[--duration-state] hover:bg-surface"
              >
                <p className="flex items-center gap-2 text-h4 text-ink">
                  {n.title}
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-ink-subtle transition-transform duration-[--duration-state] group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </p>
                <p className="mt-2 text-sm text-ink-muted">{n.body}</p>
              </Link>
            ))}
          </div>

          <Button asChild variant="secondary" className="mt-10">
            <SiteLink href="/">Back to the start</SiteLink>
          </Button>
        </div>
      </Container>
    </>
  );
}
