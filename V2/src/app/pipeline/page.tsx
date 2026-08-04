import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Backdrop from "@/components/Backdrop";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

const DemoShell = dynamic(() => import("@/components/demo/DemoShell"));

export const metadata: Metadata = {
  title: "The evidence pipeline, in detail",
  description:
    "Watch one AI change get captured, sealed with hybrid post-quantum signatures, written to a tamper-evident transparency log and verified offline — real cryptography, running live in your browser. Then try to forge it.",
  alternates: { canonical: "/pipeline" },
  openGraph: {
    title: "Run the CooL evidence pipeline live",
    description:
      "Real ML-DSA-65 + Ed25519 signatures, a real RFC 6962 Merkle log, and an offline verifier — executing in your browser. Nothing pre-recorded.",
    url: "/pipeline",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Run the CooL evidence pipeline live",
    description:
      "Real post-quantum cryptography in your browser. Seal an AI change, then try to forge it.",
  },
};

/**
 * The proof page.
 *
 * Everything cryptographic on this route executes on the visitor's machine
 * using the same SDK that is published on GitHub. The page exists so that the
 * claim "you don't have to trust us" can be tested rather than read.
 */
export default function PipelinePage() {
  return (
    <>
      <Backdrop />
      <div className="grain" aria-hidden />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pt-10 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to the demo
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
          >
            <LayoutDashboard className="size-3.5" /> Open the dashboard
          </Link>
        </div>

        <header className="mt-8 max-w-3xl">
          <p className="kicker text-[14px]">Live · nothing pre-recorded</p>
          <h1 className="display mt-3 text-[clamp(2.4rem,8vw,4.2rem)]">
            The pipeline,
            <br />
            taken apart.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-fog sm:text-[17px]">
            <Link href="/demo" className="text-verify hover:underline">
              The demo
            </Link>{" "}
            shows what one save produces. This is the same machinery with the lid
            off, for anyone who wants to read the stages rather than watch them —
            documented, governed, sealed and provable before the laptop closes.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-fog">
            Then open the other four views: the same change traced across every
            system it touches, the connectors and exactly what each one writes
            for you, what the model predicts is about to break, and the bytes
            underneath all of it.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-mist">
            The cryptography here is real and runs on your machine: deterministic
            CBOR, SHA-256 commitments, ML-DSA-65 + Ed25519 hybrid signatures, an
            RFC 6962 transparency log, and the offline verifier. Steps that would
            need a server or a third-party API are marked{" "}
            <span className="font-mono text-[12px] text-mock">SIMULATED</span>,
            and the estate data is synthetic — we don&apos;t dress either up.
          </p>
        </header>

        <div className="mt-9">
          <DemoShell />
        </div>

        <footer className="mt-14 border-t border-line pt-6">
          <p className="font-mono text-[11.5px] leading-relaxed text-mist">
            Source ·{" "}
            <a
              href="https://github.com/KenidoesCode/cool-sdk"
              target="_blank"
              rel="noreferrer"
              className="text-verify hover:underline"
            >
              cool-sdk
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/KenidoesCode/cool-verifier"
              target="_blank"
              rel="noreferrer"
              className="text-verify hover:underline"
            >
              cool-verifier
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/KenidoesCode/cool-spec"
              target="_blank"
              rel="noreferrer"
              className="text-verify hover:underline"
            >
              cool-spec
            </a>{" "}
            · Apache-2.0 · Northwind Cipher Pvt. Ltd.
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-mist/80">
            Hardware attestation is reported as MOCK and public anchoring as
            ABSENT because neither ships yet. The verifier will never mark them
            as passing.
          </p>
        </footer>
      </main>
    </>
  );
}
