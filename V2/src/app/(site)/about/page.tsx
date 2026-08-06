import type { Metadata } from "next";
import Link from "next/link";

import { GateSummary } from "@/components/security/GateLadder";
import { Button } from "@/components/ui/button";
import {
  Container,
  DataList,
  Section,
  SectionHeader,
} from "@/components/ui/primitives";
import { GATES } from "@/content/gates";
import { PRINCIPLES } from "@/content/investors";
import { CONTACT } from "@/lib/contact";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Northwind Cipher builds CooL — cryptographic evidence for AI change. What we believe, what we refuse to build, and where we actually are.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="About"
            title="We build the part that has to be checkable."
            lead="CooL exists because the interesting question about an AI system is not what it did but whether you can prove what it did — to a regulator, to a customer, or to yourself six months later when something has gone wrong and nobody remembers the change that caused it."
          />
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="Principles"
            title="The decisions everything else follows from."
            lead="These are engineering constraints rather than values-page adjectives. Each one rules something out, which is the only test of whether a principle is real."
          />
          <ol className="mt-10 border-t border-line">
            {PRINCIPLES.map((p) => (
              <li key={p.n} className="border-b border-line py-6">
                <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
                  <span
                    className="font-mono text-xs text-ink-subtle"
                    data-numeric
                  >
                    {p.n}
                  </span>
                  <div>
                    <h2 className="text-h4">{p.title}</h2>
                    <p className="mt-2 max-w-[70ch] text-sm text-ink-muted">
                      {p.detail}
                    </p>
                    <p className="mt-2.5 max-w-[70ch] text-sm text-ink">
                      {p.consequence}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
            <SectionHeader
              eyebrow="Honesty"
              title="We publish what does not work."
              lead="Two of seven verification domains do not pass today, and both are named on the homepage rather than in a footnote. The readiness ladder below is public, and the build fails if the copy claims a rung above the one we are on."
            />
            <div className="flex flex-col gap-6">
              <p className="max-w-[64ch] text-sm text-ink-muted">
                This is not modesty. A company selling evidence has exactly one
                asset, and it is that its statements can be checked. The moment
                we round <code className="font-mono text-[0.8125rem]">simulated</code>{" "}
                up to <code className="font-mono text-[0.8125rem]">pass</code> in
                a slide, every other number we produce becomes something you have
                to verify independently — at which point you may as well use
                somebody else&apos;s product.
              </p>
              <p className="max-w-[64ch] text-sm text-ink-muted">
                So the rules are in the code rather than in a style guide. The
                verifier will not report a hardware pass without a hardware root.
                The site&apos;s CI will not build with an over-claim in it.
                Neither can be talked around.
              </p>
              <GateSummary gates={GATES} />
              <div>
                <Button asChild variant="secondary">
                  <Link href="/security/readiness">Read the full ladder</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader eyebrow="The company" title="Details." />
          <DataList
            className="mt-10"
            rows={[
              { label: "Legal entity", value: SITE.company },
              { label: "Based in", value: CONTACT.city },
              { label: "Product", value: "CooL — cryptographic evidence for AI change" },
              { label: "Licence", value: "SDK and verifier are Apache-2.0" },
              {
                label: "Source",
                value: (
                  <a
                    href={SITE.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent underline underline-offset-4"
                  >
                    github.com/KenidoesCode/cool-sdk
                  </a>
                ),
              },
              {
                label: "Contact",
                value: (
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="text-accent underline underline-offset-4"
                  >
                    {CONTACT.email}
                  </a>
                ),
              },
            ]}
          />

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/contact">Talk to us</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/verify">Check the cryptography</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
