import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { SurfaceHeader } from "@/components/shell/SurfaceHeader";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { SITE } from "@/lib/site";

const DemoShell = dynamic(() => import("@/components/demo/DemoShell"));

export const metadata: Metadata = {
  title: "The evidence pipeline, in detail",
  description:
    "Watch one AI change get captured, sealed with hybrid post-quantum signatures, written to a tamper-evident transparency log and verified offline — real cryptography running in your browser. Then try to forge it.",
  alternates: { canonical: "/pipeline" },
  openGraph: {
    title: "Run the CooL evidence pipeline live",
    description:
      "Real ML-DSA-65 + Ed25519 signatures, a real RFC 6962 Merkle log, and an offline verifier — executing in your browser. Nothing pre-recorded.",
    url: "/pipeline",
    type: "website",
  },
};

/**
 * The proof page.
 *
 * Everything cryptographic here executes on the visitor's machine using the
 * same SDK that is published on GitHub. The page exists so the claim "you don't
 * have to trust us" can be tested rather than read — which is also why the
 * forge buttons are prominent rather than hidden: watching the verifier reject
 * a tampered record is the only thing that proves the acceptance means anything.
 */
export default function PipelinePage() {
  return (
    <div data-surface="console">
      <SurfaceHeader
        eyebrow="Live · nothing pre-recorded"
        title="The pipeline, taken apart."
        lead="Eight stages, each declaring whether it is real or simulated. Then four attack buttons that forge the receipt, so you can watch the same verifier reject it and name the domain that failed."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/verify">The seven-stop walkthrough</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/console">Open the console</Link>
            </Button>
          </>
        }
        honesty={
          <>
            The cryptography is real and runs on your machine: deterministic
            CBOR, SHA-256 commitments, ML-DSA-65 + Ed25519 hybrid signatures, an
            RFC 6962 transparency log, and the offline verifier. Stages that
            would need a server or a third-party API are labelled{" "}
            <code className="font-mono text-[0.8125rem]">SIMULATED</code> from
            the stage&apos;s own field rather than from copy, and the estate data
            is synthetic. Hardware attestation reports{" "}
            <code className="font-mono text-[0.8125rem]">MOCK</code> and public
            anchoring <code className="font-mono text-[0.8125rem]">ABSENT</code>{" "}
            because neither ships yet — the verifier will never mark them as
            passing, and nothing in this UI can reach that rule.
          </>
        }
      />

      <Container>
        <div className="py-10">
          <DemoShell />
        </div>

        <div className="border-t border-line py-8">
          <p className="font-mono text-xs leading-relaxed text-ink-subtle">
            Source ·{" "}
            {[
              ["cool-sdk", SITE.repo],
              ["cool-verifier", "https://github.com/KenidoesCode/cool-verifier"],
              ["cool-spec", "https://github.com/KenidoesCode/cool-spec"],
            ].map(([label, href], i) => (
              <span key={label}>
                {i > 0 && " · "}
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ink underline underline-offset-4"
                >
                  {label}
                </a>
              </span>
            ))}{" "}
            · Apache-2.0 · {SITE.company}
          </p>
        </div>
      </Container>
    </div>
  );
}
