import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";

import { CodeBlock } from "@/components/ui/code";
import { Button } from "@/components/ui/button";
import { Reveal, Stagger } from "@/components/ui/motion";
import {
  Card,
  Container,
  Eyebrow,
  Mono,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/primitives";
import { PipelineDiagram } from "@/components/diagrams/PipelineDiagram";
import { CURRENT_STAGE } from "@/content/gates";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * The landing page.
 *
 * Structure borrowed from Phala's philosophy rather than its layout: every
 * claim is immediately followed by the artifact that proves it. The hero makes
 * a statement and then shows the command; the seal section makes a statement
 * and then shows the receipt fields; the verification section makes a statement
 * and then hands the reader a verifier we do not control.
 *
 * The section that matters most is `<WhatIsNotTrue />`. A page that only ever
 * says yes teaches the reader nothing about whether its yeses are worth
 * anything — publishing the two domains that report `simulated` is what makes
 * the five that report `pass` mean something.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Seal />
      <Verify />
      <WhatIsNotTrue />
      <Where />
      <CallToAction />
    </>
  );
}

/* ── hero ─────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="border-b border-line">
      <Container>
        <div className="grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:gap-16 lg:py-24">
          <div className="flex flex-col justify-center gap-6">
            <Reveal>
              <Link href="/security/readiness" className="group w-fit">
                <StatusBadge status="warn" className="transition-colors group-hover:border-warn/50">
                  Stage 0 · working demo · attestation simulated
                </StatusBadge>
              </Link>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="text-display max-w-[16ch]">
                Every change to your AI, sealed as evidence.
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="max-w-[52ch] text-lead text-ink-muted">
                A prompt edit, a model swap, a permission grant — CooL commits
                each one to a signed, tamper-evident record. Then it hands you a
                verifier we do not control, so you never have to take our word
                for any of it.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/verify">
                    Verify a record yourself
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/docs/quickstart">Read the quickstart</Link>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* The artifact, not an illustration of one. This is the actual
              command, and the output below it is the actual shape of a verify
              run — which is why it is a code block and not a screenshot. */}
          <Reveal delay={0.1} className="flex flex-col justify-center">
            <CodeBlock
              lang="bash"
              filename="your machine, offline"
              code={`$ npm install -g cool-nwc
$ cool verify ./change-receipt.json --offline

  canonical      pass   deterministic CBOR matches core
  binding        pass   sha256 digest matches record
  signature      pass   ML-DSA-65 + Ed25519 hybrid
  inclusion      pass   RFC 6962 audit path to root
  consistency    pass   log head is append-only
  attestation    simulated  no hardware root in this build
  witnesses      absent     no independent co-signer

  VERDICT  5 pass · 1 simulated · 1 absent
  network requests during verification: 0`}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ── what gets sealed ─────────────────────────────────────────────────────── */

const SEALED = [
  {
    field: "core",
    detail:
      "The change itself — what was edited, from what, to what, by whom, under which policy.",
  },
  {
    field: "binding_digest",
    detail:
      "SHA-256 over the canonical CBOR of the core. Change one byte of the record and this stops matching.",
  },
  {
    field: "signature",
    detail:
      "ML-DSA-65 (FIPS 204) and Ed25519, together. Never post-quantum alone, never classical alone.",
  },
  {
    field: "log_entry",
    detail:
      "An RFC 6962 leaf and its audit path, so the record's position in history is provable, not asserted.",
  },
  {
    field: "attestation",
    detail:
      "Where the record was produced. Today this block honestly reads simulated.",
  },
] as const;

function Seal() {
  return (
    <Section tone="surface">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
          <SectionHeader
            eyebrow="What a record contains"
            title="Five fields, and each one can be checked independently."
            lead="A receipt is not a log line. Every field carries its own proof obligation, and the verifier reports on each separately rather than returning a single green tick."
          />

          <div>
            <dl className="border-t border-line">
              {SEALED.map((row) => (
                <div
                  key={row.field}
                  className="grid gap-1.5 border-b border-line py-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-8"
                >
                  <dt>
                    <Mono className="text-ink">{row.field}</Mono>
                  </dt>
                  <dd className="text-sm text-ink-muted">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ── verification ─────────────────────────────────────────────────────────── */

function Verify() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="The part that matters"
          title="You verify it. Not us."
          lead="Evidence that only its author can check is not evidence. The verifier is published, it runs offline, and it will reject a record we produced if that record is wrong."
        />

        <div className="mt-12">
          <PipelineDiagram />
        </div>

        <Stagger className="mt-12 grid gap-px bg-line sm:grid-cols-3">
          {[
            {
              title: "Offline is measured, not claimed",
              body: "During a verify run the page replaces fetch, XMLHttpRequest, WebSocket, EventSource and sendBeacon with counting wrappers, then prints the counter. The zero you see is a measurement.",
            },
            {
              title: "It refuses when it should",
              body: "Run the verifier with --require-hardware against a record sealed sixty seconds ago and it refuses, because that record has no vendor-rooted quote. A demo that could only go green would prove nothing.",
            },
            {
              title: "The same code is on npm",
              body: "The verifier in your browser and the one in cool-nwc are the same implementation, checked against the published cool-spec conformance vectors on every build.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-canvas p-6">
              <h3 className="text-h4">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{c.body}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </Section>
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
          eyebrow="Where we actually are"
          title="The two things this cannot prove yet."
          lead="Both are listed here rather than buried, because a vendor who hides its gaps has told you nothing reliable about its strengths. These are enforced in the verifier — no amount of presentation makes them go green."
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

/* ── where it runs ────────────────────────────────────────────────────────── */

function Where() {
  return (
    <Section>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
          <SectionHeader
            eyebrow="Where it runs"
            title="Never in the critical path."
            lead="Capture is asynchronous, out-of-band and fail-open. CooL adds no latency to inference, and if CooL is down your AI keeps serving. Loss is counted and written as a signed entry — never silent."
          />

          <div className="flex flex-col gap-px bg-line">
            {[
              {
                k: "Control plane",
                v: "Ours. Orchestration, billing, updates.",
              },
              {
                k: "Data plane",
                v: "Yours. Evidence, prompts and PII stay inside your boundary. The split is architectural, not a policy promise.",
              },
              {
                k: "Signing keys",
                v: "Derived inside the enclave from the measurement. There is no key for us to hold, which is why we cannot forge your records.",
              },
              {
                k: "If CooL is unreachable",
                v: "Your inference continues. Capture queues, and what it could not queue is counted.",
              },
            ].map((row) => (
              <div key={row.k} className="grid gap-1 bg-canvas py-4 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-8">
                <p className="text-label uppercase text-ink-subtle">{row.k}</p>
                <p className="text-sm text-ink-muted">{row.v}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ── CTA ──────────────────────────────────────────────────────────────────── */

function CallToAction() {
  return (
    <Section tone="surface">
      <Container>
        <div className="flex flex-col items-start gap-6">
          <SectionHeader
            eyebrow="Start"
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
