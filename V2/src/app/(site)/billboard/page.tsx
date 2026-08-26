import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { SiteLink } from "@/components/shell/SiteLink";

const TerminalBillboard = dynamic(
  () => import("@/components/billboard/TerminalBillboard"),
);

export const metadata: Metadata = {
  title: "npx cool verify",
  description:
    "One command. Real post-quantum signatures, a real transparency log, and a real offline verdict — minted and checked in your browser as you watch.",
  alternates: { canonical: "/billboard" },
  openGraph: {
    title: "npx @northwind/cool-verifier receipt.json",
    description: "VERIFIED OFFLINE · ml-dsa-65 + ed25519 · no network.",
    url: "/billboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "npx @northwind/cool-verifier receipt.json",
    description: "VERIFIED OFFLINE · ml-dsa-65 + ed25519 · no network.",
  },
};

/**
 * The board.
 *
 * No navigation chrome, no explanation, no scroll. A billboard earns attention
 * by being one thing, so the only affordances here are a replay and a quiet way
 * back — both small enough to ignore.
 */
export default function BillboardPage() {
  return (
    <>
      <TerminalBillboard />

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-5">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <SiteLink
            href="/"
            className="font-mono text-[11px] tracking-[0.16em] text-mist/60 uppercase transition-colors hover:text-ink"
          >
            northwindcipher.com
          </SiteLink>
          <Link
            href="/demo"
            className="font-mono text-[11px] tracking-[0.16em] text-mist/60 uppercase transition-colors hover:text-ink"
          >
            see the whole pipeline
          </Link>
        </div>
      </div>
    </>
  );
}
