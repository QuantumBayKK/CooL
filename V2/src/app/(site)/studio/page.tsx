import type { Metadata } from "next";
import dynamic from "next/dynamic";

/**
 * The studio.
 *
 * One route, two surfaces: an Atlassian-shaped console over the evidence a
 * confidential deployment produces, and a VS-Code-shaped IDE over the code that
 * produces it. Both are driven by the same live SDK session, which is booted in
 * the browser — so the whole page is code-split and rendered on the client.
 * There is nothing to server-render here: the first meaningful paint is an
 * enclave that has not started yet.
 */
const StudioShell = dynamic(() => import("@/components/studio/StudioShell"));

export const metadata: Metadata = {
  title: "Studio",
  description:
    "The CooL SDK and console for confidential compute: an evidence plane running inside a Phala dstack TEE, with measurement-sealed keys, RA-TLS capture, GPU attestation binding, and an offline verifier you can attack in the browser.",
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "CooL Studio — the SDK, the console, and the IDE",
    description:
      "Boot a confidential VM, seal keys to its measurement, capture AI changes over RA-TLS, and verify the receipts offline. Every record on the page is signed in your browser.",
    url: "/studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CooL Studio",
    description:
      "The evidence plane, running inside a TEE — with the code that puts it there open in the editor beside it.",
  },
};

export default function StudioPage() {
  return <StudioShell />;
}
