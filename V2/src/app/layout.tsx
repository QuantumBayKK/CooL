import type { Metadata, Viewport } from "next";
import {
  Anton,
  Bebas_Neue,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* keynote voice for the investors page — SF-Pro-Display-adjacent */
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Site-wide metadata.
 *
 * `metadataBase` is what lets every other route declare relative OG images and
 * canonicals and still emit absolute URLs — without it Next silently ships
 * relative OG tags, which most crawlers and every social unfurler ignore.
 *
 * The title template is `%s — CooL`, so each route sets only its own subject.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [
    { name: "Pranauv Shrinaath S" },
    { name: "Kailosh Kalimuthu" },
  ],
  creator: SITE.company,
  publisher: SITE.company,
  keywords: [
    "AI governance",
    "AI change management",
    "AI audit trail",
    "AI compliance automation",
    "EU AI Act Article 12",
    "DPDP Rules 2025",
    "tamper-evident log",
    "transparency log",
    "post-quantum cryptography",
    "ML-DSA",
    "AI observability",
    "AI system of record",
    "verifiable AI evidence",
    "CooL",
    "Northwind Cipher",
  ],
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

/**
 * Structured data.
 *
 * Three linked nodes rather than one blob: the company, the product, and the
 * site itself. Search engines resolve the `@id` references between them, which
 * is what earns a knowledge-panel style result rather than a plain blue link.
 */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.company,
        alternateName: SITE.name,
        url: SITE.url,
        description: SITE.description,
        foundingDate: "2026",
        founder: [
          {
            "@type": "Person",
            name: "Pranauv Shrinaath S",
            jobTitle: "Founder & CEO",
            sameAs: ["https://github.com/KenidoesCode"],
          },
          {
            "@type": "Person",
            name: "Kailosh Kalimuthu",
            jobTitle: "Co-Founder & CTO",
            sameAs: ["https://github.com/Sk1zmo"],
          },
        ],
        sameAs: [
          "https://github.com/KenidoesCode/cool-sdk",
          "https://github.com/KenidoesCode/cool-verifier",
          "https://github.com/KenidoesCode/cool-spec",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.url}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE.url}/#software`,
        name: SITE.name,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "AI governance and compliance automation",
        operatingSystem: "Web, Linux, Kubernetes",
        url: SITE.url,
        description:
          "CooL automatically documents, governs and cryptographically seals every change an enterprise makes to its AI — prompts, models, parameters and agent permissions — producing tamper-proof, offline-verifiable audit evidence with zero manual work.",
        publisher: { "@id": `${SITE.url}/#organization` },
        featureList: [
          "Automatic capture of every AI change",
          "Tamper-evident RFC 6962 transparency log",
          "Hybrid post-quantum signatures (ML-DSA-65 + Ed25519)",
          "Offline-verifiable audit evidence",
          "Predictive change-risk scoring with recommended resolutions",
          "One-click audit export mapped to EU AI Act and DPDP",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free SDK; paid SaaS and enterprise platform licence.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Static, developer-authored JSON — no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${bebas.variable} ${inter.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <head>
        <StructuredData />
        {/* Entrances ship as opacity:0 and are animated in on the client. If JS
            never arrives, this makes sure the page is still readable. */}
        <noscript>
          <style>{`[data-reveal],[data-word]{opacity:1!important;filter:none!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
