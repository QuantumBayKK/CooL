import type { Metadata } from "next";
import Link from "next/link";

import { GateLadder } from "@/components/security/GateLadder";
import { CodeBlock } from "@/components/ui/code";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/ui/primitives";
import { CURRENT_STAGE, GATES } from "@/content/gates";

export const metadata: Metadata = {
  title: "Readiness",
  description:
    "The four-rung readiness ladder CooL is built against, which rung the product is actually on, and the exact sentence each rung licenses. Published rather than summarised.",
  alternates: { canonical: "/security/readiness" },
};

/**
 * The readiness ladder, published.
 *
 * Nobody does this, and that is the argument for doing it. A security vendor
 * that shows you exactly which rung it is on — with the two domains that report
 * `simulated` named on the front page — is telling you something checkable. One
 * that claims all four is telling you something you would have to take on
 * trust, from a company whose product exists because trust is not enough.
 */
export default function ReadinessPage() {
  return (
    <>
      <Section bordered={false}>
        <Container>
          <SectionHeader
            as="h1"
            eyebrow="Readiness"
            title="We publish the ladder, and the rung we are on."
            lead="Four rungs. Each one carries a specific sentence we are allowed to say once it is fully green — and nothing broader. Selling a claim above your real rung is the one thing a security brand cannot survive, so the constraint is enforced in the build rather than left to judgement."
          />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/verify">Check the current rung yourself</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/security">Read the security model</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <SectionHeader
            eyebrow="How it is enforced"
            title="The build rejects an over-claim."
            lead="This is the same mechanism the verifier uses to stop `simulated` rounding up to `pass`: the rule lives in code, not in an instruction someone has to remember."
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            <div className="flex flex-col gap-4 text-sm text-ink-muted">
              <p>
                Every reserved phrase is stored against the gate that would
                license it. A build containing one from a rung above{" "}
                <code className="font-mono text-[0.8125rem] text-ink">
                  CURRENT_GATE
                </code>{" "}
                fails CI, and the failure names the gate — so it tells you what
                you would have to finish rather than only telling you off.
              </p>
              <p>
                Raising the site&apos;s claims is therefore a deliberate one-line
                change, reviewed like any other, and it will not pass until the
                evidence for that rung actually exists.
              </p>
              {/* claim-exempt:start
                  This page documents the guard, so it necessarily quotes the
                  phrases the guard rejects. Naming a phrase in order to say we
                  are not allowed to use it is the opposite of claiming it, and
                  the scanner cannot tell the two apart. The exemption is scoped
                  to these two blocks and nothing else on the page. */}
              <p>
                Some phrases are reserved at every rung. No amount of progress
                licenses &ldquo;unhackable&rdquo;.
              </p>
            </div>

            <CodeBlock
              lang="bash"
              filename="npm run verify:claims"
              code={`$ node scripts/verify-claims.mjs

  FAIL  src/content/investors.ts:58
        reserved phrase: "battle-tested"
        licensed only at Gate 3; we are at Stage 0

  scanned 61 files against 31 reserved phrases
  1 claim violation(s).

  Either rewrite the copy, or — if the evidence
  genuinely exists — raise CURRENT_GATE and tick
  the items that justify it. Do not add an
  exemption to make this pass.`}
            />
            {/* claim-exempt:end */}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow={`Currently: Stage ${CURRENT_STAGE.n}`}
            title="The ladder."
            lead="Counted, not estimated. Every tick is an item somebody can check."
          />
          <div className="mt-10">
            <GateLadder gates={GATES} />
          </div>
        </Container>
      </Section>
    </>
  );
}
