import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Archivo, Inter } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { Providers } from "@/app/providers";
import { Analytics } from "@/components/shell/Analytics";
import { SITE } from "@/lib/site";

/**
 * Typefaces — four jobs, and only what can actually be shipped.
 *
 * ── on the requested pairing ──
 *
 * The brief asked for: Tempting, Swifter, Athelas, Vanguard, Inter, Times New
 * Roman MT, Arial, Epic Pro Shadow Light, Balboa, Archivo, Abril. Most of that
 * list cannot be self-hosted on a public site, and shipping a font without a
 * webfont licence is a real liability rather than a technicality — so the list
 * splits three ways:
 *
 *   SERVED    Archivo, Abril Fatface, Inter — open licence (OFL), self-hosted
 *             by `next/font` from the build output, no third-party request.
 *   NAMED     Athelas, Times New Roman, Arial — present in the stacks below as
 *             family names. They resolve where the reader already has them
 *             (Athelas ships with macOS/iOS; the other two are near-universal)
 *             and cost nothing when they do not.
 *   OMITTED   Vanguard, Balboa, Tempting, Swifter, Epic Pro Shadow Light.
 *             Commercial or unidentifiable; none has a licence in this repo.
 *             Buy a webfont licence and each is a one-line swap here.
 *
 * The four that do the work:
 *
 *   display   Archivo. Replaces IBM Plex Sans. A grotesque with tighter
 *             apertures and a firmer vertical stress — it holds up at 48px in
 *             a way Plex, drawn for text, does not.
 *   editorial Abril Fatface. High-contrast didone, one weight, used ONLY for
 *             figures and chapter numerals. It is the loudest thing in the
 *             system and would fight the copy if it were let near a heading.
 *   sans      Inter. Body and every piece of UI chrome. Unchanged.
 *   serif     Athelas → Times New Roman → Georgia. Pull quotes and the deck's
 *             narrative lines. Not a webfont at all, on purpose: a serif used
 *             for a dozen sentences does not justify 40 kB on the critical
 *             path when three good ones are already on the reader's machine.
 *
 * Weights are enumerated rather than left variable-wide — font bytes sit on
 * the critical path for Largest Contentful Paint, and a family requested at
 * nine weights when the design uses two costs ~200 kB for glyphs never drawn.
 *
 * `display: "swap"` throughout: a fallback face beats invisible text, and
 * Next's `adjustFontFallback` keeps the metric mismatch small enough that the
 * swap does not shift layout.
 */
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
  // Not preloaded: the film-led pages never render this face, and a preload
  // on every route competed with their headline font for LCP bandwidth.
  preload: false,
});

/** One weight exists, and one is all this should ever be used at. */
const abril = Abril_Fatface({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-abril",
  display: "swap",
  // Not preloaded: the film-led pages never render this face, and a preload
  // on every route competed with their headline font for LCP bandwidth.
  preload: false,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  // Not preloaded: the film-led pages never render this face, and a preload
  // on every route competed with their headline font for LCP bandwidth.
  preload: false,
});

/**
 * Geist Mono, defined here rather than imported from `geist/font/mono` so it
 * can opt out of preloading (the package preloads 71 KB on every route,
 * including the film-led pages that never use it).
 */
const GeistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
  weight: "100 900",
  preload: false,
});

const ORG_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: "Northwind Cipher",
  alternateName: [
    "NorthWind Cipher",
    "Northwind Cipher Pvt Ltd",
    "NorthWind Cipher Pvt Ltd",
    "Northwind Cipher CooL",
  ],
  legalName: SITE.company,
  url: `${SITE.url}/`,
  logo: `${SITE.url}/assets/logo-512.png`,
  sameAs: ["https://github.com/Northwind-Cipher", SITE.repo, SITE.npm],
  memberOf: {
    "@type": "ProgramMembership",
    programName: "NVIDIA Inception Program",
    hostingOrganization: { "@type": "Organization", name: "NVIDIA" },
  },
}).replace(/</g, "\\u003c");

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `Northwind Cipher — ${SITE.name}, ${SITE.tagline.toLowerCase()}`,
    // The company name rides on every title so a search for "Northwind
    // Cipher" matches any page, not only the front door.
    template: `%s — ${SITE.name} by Northwind Cipher`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.company, url: SITE.url }],
  creator: SITE.company,
  publisher: SITE.company,
  category: "technology",
  keywords: [
    "AI audit trail",
    "AI governance",
    "AI compliance",
    "verifiable AI",
    "tamper-evident logs",
    "post-quantum signatures",
    "ML-DSA-65",
    "confidential computing",
    "Intel TDX",
    "Phala dstack",
    "remote attestation",
    "transparency log",
    "RFC 6962",
    "EU AI Act Article 12",
    "NVIDIA Inception",
    "Northwind Cipher",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/assets/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/assets/apple-touch-icon.png",
  },
  alternates: {
    types: { "text/plain": "/llms.txt" },
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: `${SITE.name} by Northwind Cipher`,
    title: `Northwind Cipher — ${SITE.name}, ${SITE.tagline.toLowerCase()}`,
    description: SITE.description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `Northwind Cipher — ${SITE.name}, ${SITE.tagline.toLowerCase()}`,
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
};

export const viewport: Viewport = {
  // One colour, because there is one theme. Declared unconditionally so that a
  // reader whose OS is set to dark still gets a white iOS status bar matching
  // the white canvas, rather than the black one Safari would otherwise infer.
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // Not `maximumScale: 1`. Blocking pinch-zoom is a WCAG 1.4.4 failure, and on
  // a site whose content includes 64-character digests it is a cruel one.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `suppressHydrationWarning` on <html> only: the public site's pre-paint
  // script (src/app/(film)/layout.tsx) sets data-theme on this element before
  // React attaches, to avoid a theme flash. It covers this element's own
  // attributes, not its children, so real mismatches elsewhere still surface.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${abril.variable} ${inter.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh bg-canvas text-ink antialiased">
        {/* Skip link — the first tab stop on every page. Visually hidden until
            focused, which is the only way it helps the people who need it
            without becoming clutter for everyone else. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-line focus:bg-canvas focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        {/* The organisation, on every app-rendered page. Same `@id` as the
            static front door, so crawlers merge them into one entity. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ORG_JSON_LD }}
        />
        <Providers>{children}</Providers>
        {/* Renders nothing unless NEXT_PUBLIC_GA_ID is set. */}
        <Analytics />
      </body>
    </html>
  );
}
