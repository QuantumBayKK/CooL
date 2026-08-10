import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import { Providers } from "@/app/providers";
import { SITE } from "@/lib/site";

/**
 * Typefaces — three families, three jobs, loaded once.
 *
 * Weights are enumerated rather than left variable-wide. Plex ships nine
 * weights and this design uses two; requesting all of them costs roughly 200 kB
 * of font data for glyphs that are never drawn, and font bytes are on the
 * critical path for Largest Contentful Paint.
 *
 * `display: "swap"` on all three: a fallback face is strictly better than
 * invisible text, and with `adjustFontFallback` (Next's default) the metric
 * mismatch is small enough that the swap does not shift layout.
 */
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex",
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
      className={`${plex.variable} ${inter.variable} ${GeistMono.variable}`}
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
      </body>
    </html>
  );
}
