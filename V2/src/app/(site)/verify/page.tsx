import type { Metadata } from "next";
import dynamic from "next/dynamic";

/**
 * The demo.
 *
 * Seven stops, one screen each, driven by a single prompt edit. The whole route
 * is client-rendered and code-split because the first meaningful thing on it is
 * an enclave that has not booted yet — there is nothing here a server could
 * usefully render ahead of time, and pretending otherwise would only put a
 * skeleton of the real thing in front of the real thing.
 */
const StoryShell = dynamic(() => import("@/components/story/StoryShell"));

export const metadata: Metadata = {
  title: "Verify a record",
  description:
    "An engineer changes one line of a prompt and saves. Watch the governance record, the policy decision, the audit evidence and the cryptographic proof appear on their own — then verify the result offline, with the network instrumented and counted.",
  alternates: { canonical: "/verify" },
  openGraph: {
    title: "CooL — change one prompt, watch the paperwork do itself",
    description:
      "One save produces a governance record, a policy decision, sealed evidence and an offline-verifiable proof. Real ML-DSA-65 + Ed25519 signatures and a real RFC 6962 log, computed in your browser.",
    url: "/verify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CooL — change one prompt, watch the paperwork do itself",
    description:
      "Nobody opened a ticket. Every hash, signature and verdict on the page is computed live, and the verifier runs with zero network calls.",
  },
};

export default function DemoPage() {
  return <StoryShell />;
}
