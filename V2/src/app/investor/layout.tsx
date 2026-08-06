import type { Metadata } from "next";

/**
 * The private tree.
 *
 * `noindex, nofollow, noarchive, nosnippet` is set here so it applies to every
 * descendant automatically — a page added under /investor tomorrow inherits it
 * without anyone remembering to. The middleware sets the same directives as an
 * `x-robots-tag` header, which covers redirects and non-HTML responses where a
 * meta tag never gets parsed.
 *
 * `/investor` is also absent from the sitemap. Submitting a noindex URL asks a
 * crawler to index a page that refuses to be indexed; at best it wastes crawl
 * budget, at worst it advertises the route's existence in a coverage report.
 */
export const metadata: Metadata = {
  title: { default: "Investor access", template: "%s — CooL investor room" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
