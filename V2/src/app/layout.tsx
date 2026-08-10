import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Archivo, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";

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
});

/** One weight exists, and one is all this should ever be used at. */
const abril = Abril_Fatface({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-abril",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.company }],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
  // No `suppressHydrationWarning` on <html>: it was there only to excuse the
  // theme script mutating the element before React attached. With that script
  // gone the server and client trees agree exactly, and leaving the escape
  // hatch in place would silence real hydration mismatches site-wide.
  return (
    <html
      lang="en"
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
        <Providers>{children}</Providers>
        {/* Renders nothing unless NEXT_PUBLIC_GA_ID is set. */}
        <Analytics />
      </body>
    </html>
  );
}
