import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Backdrop from "@/components/Backdrop";
import { ArrowLeft, Play } from "lucide-react";

/**
 * The console is the whole page below the fold and pulls in every chart, so it
 * is code-split: the header and the honesty banner render immediately, and the
 * application shell arrives with them rather than blocking them.
 */
const ConsoleApp = dynamic(() => import("@/components/console/ConsoleApp"));

export const metadata: Metadata = {
  title: "Console",
  description:
    "Every AI change across the estate — captured, sealed, risk-scored and audit-ready. Predictive change-risk scoring with explainable drivers, recommended fixes, EU AI Act and DPDP coverage, and one-click audit export.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "The CooL console",
    description:
      "Every AI change in one place, already documented. Predictive risk scoring, recommended resolutions, and audit export that is finished before anyone asks.",
    url: "/dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The CooL console",
    description:
      "Every AI change in one place, already documented — with what is about to go wrong, and the fix.",
  },
};

/**
 * The product surface.
 *
 * The estate is synthetic — a real one would be a customer's private data — but
 * the risk model, the rankings, the compliance coverage and the audit export
 * are the production algorithms operating on it. The banner says exactly that,
 * because a demo that blurs the line is worth nothing to a buyer who checks.
 */
export default function DashboardPage() {
  return (
    <>
      <Backdrop />
      <div className="grain" aria-hidden />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-10 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-mist transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Back to the deck
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 font-mono text-[12px] text-mist transition-colors hover:border-verify/40 hover:text-ink"
          >
            <Play className="size-3.5" /> See the evidence pipeline
          </Link>
        </div>

        <header className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <p className="kicker text-[14px]">The console</p>
              <h1 className="display mt-3 text-[clamp(2.2rem,7vw,3.6rem)]">
                Every AI change
                <br />
                in one place. Already done.
              </h1>
              <p className="mt-4 text-[15.5px] leading-relaxed text-fog sm:text-[16.5px]">
                This is what a regulated enterprise opens on Monday morning:
                everything their AI changed last week, documented and sealed
                without anyone writing a word — plus what is about to go wrong,
                and the fix for it.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-live/40 bg-live/[0.08] px-3.5 py-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-live/60" />
                <span className="relative inline-flex size-2 rounded-full bg-live" />
              </span>
              <span className="font-mono text-[11px] tracking-[0.12em] text-live uppercase">
                Demo Enterprise Pvt. Ltd.
              </span>
            </div>
          </div>

          <p className="mt-5 rounded-xl border border-line bg-panel/50 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
            <span className="font-mono text-[11px] tracking-[0.12em] text-verify uppercase">
              What&apos;s real here
            </span>
            <br />
            The estate below is synthetic — a live one would be a customer&apos;s
            private data. Everything computed from it is not: the risk model, its
            explanations, the compliance coverage and the audit export are the
            production code paths running in your browser. To watch the
            cryptography itself execute, open{" "}
            <Link href="/demo" className="text-verify hover:underline">
              the evidence pipeline
            </Link>
            .
          </p>
        </header>

        <div className="mt-8">
          <ConsoleApp />
        </div>
      </main>
    </>
  );
}
