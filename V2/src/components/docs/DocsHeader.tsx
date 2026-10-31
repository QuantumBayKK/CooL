import Link from "next/link";

import { DocsSearch } from "@/components/docs/DocsSearch";
import type { SearchEntry } from "@/lib/docs";
import { SITE } from "@/lib/site";

/**
 * Docs top bar: brand, search, and the way back to the product site.
 *
 * The homepage and pricing are static HTML outside the app router, so those
 * links are plain anchors rather than `next/link` (see `STANDALONE` in site.ts).
 */
export function DocsHeader({ index }: { index: SearchEntry[] }) {
  return (
    <header className="docs-header">
      <div className="docs-header-inner">
        <Link href="/docs" className="docs-brand" aria-label="CooL documentation home">
          <i className="docs-brand-wm" aria-hidden />
          <span className="docs-brand-tag">Docs</span>
        </Link>
        <DocsSearch index={index} />
        <nav className="docs-header-links" aria-label="Site">
          <a href="/">Home</a>
          <a href="/pricing">Pricing</a>
          <a href={SITE.repo} target="_blank" rel="noopener">GitHub</a>
          <a href="https://cal.com/coolnwc" target="_blank" rel="noopener" className="docs-header-cta">Book a call</a>
        </nav>
      </div>
    </header>
  );
}
