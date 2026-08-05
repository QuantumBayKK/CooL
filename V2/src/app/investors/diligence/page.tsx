import type { Metadata } from "next";
import InvestorKeynote from "@/components/investors/InvestorKeynote";

export const metadata: Metadata = {
  // The root template appends " — CooL", so this stays a single clean phrase
  // rather than a second em-dashed clause.
  title: "Investor diligence",
  description:
    "The architecture behind CooL, what genuinely runs today versus what does not, what we refuse to build ourselves, and exactly what ₹1 Cr converts into. Northwind Cipher Pvt. Ltd.",
  alternates: { canonical: "/investors/diligence" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "CooL — technical & operational diligence",
    description:
      "The architecture, the honest build status, the buy-versus-build ledger, and what the round buys. The part of the pitch that has to survive an engineer.",
    url: "/investors/diligence",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CooL — technical & operational diligence",
    description:
      "The architecture, an honest build ledger, and exactly what ₹1 Cr converts into.",
  },
};

export default function InvestorsPage() {
  return <InvestorKeynote />;
}
