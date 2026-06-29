import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { ExperienceProvider } from "@/providers/ExperienceProvider";
import "./globals.css";

// Narrator voice — a refined, cinematic serif with optical sizing for big statements.
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

// Witness voice — neutral, highly legible.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Instrument voice — precision/rigor, deepest technical layers only.
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const SITE_NAME = "CooL";
const SITE_TAGLINE = "The Trust Layer for Artificial Intelligence";
const SITE_DESCRIPTION =
  "As AI decides more of human life, those decisions must be provable. CooL creates cryptographically verifiable, operator-resistant evidence for AI decisions.";

export const metadata: Metadata = {
  metadataBase: new URL("https://cool.example"),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <ExperienceProvider>{children}</ExperienceProvider>
      </body>
    </html>
  );
}
