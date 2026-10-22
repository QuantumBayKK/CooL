import { Inter_Tight, JetBrains_Mono } from "next/font/google";

/**
 * Self-hosted by next/font at build time (WOFF2, font-display: swap, Latin
 * subset only). Shared by the film layout and the root 404.
 */
export const interTight = Inter_Tight({
  subsets: ["latin"],
  // Variable font: one file covers every weight the site uses.
  variable: "--font-inter-tight",
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const filmFontVars = `${interTight.variable} ${jetbrains.variable}`;
