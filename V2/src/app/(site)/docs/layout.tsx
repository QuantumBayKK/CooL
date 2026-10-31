import { DocsNav } from "@/components/docs/DocsNav";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { docSections, searchIndex } from "@/lib/docs";
import { SITE } from "@/lib/site";

/**
 * Docs shell.
 *
 * The navigation and the search index are both computed at build time and
 * passed down as props. Search runs entirely in the browser against that index —
 * there is no search API, no request-time work, and no third-party widget
 * loading a script from someone else's domain (which the CSP would have to
 * allow, and which would send every query a visitor types to a company that is
 * not us).
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="docs-site" id="top">
      <DocsHeader index={searchIndex()} />
      <div className="docs-shell">
        <div className="docs-frame">
          <DocsNav sections={docSections()} />
          <div className="docs-content min-w-0 flex-1">{children}</div>
        </div>
      </div>
      <footer className="docs-site-footer">
        <span>© {new Date().getFullYear()} {SITE.company}</span>
        <nav aria-label="Footer">
          <a href="/">Home</a>
          <a href="/pricing">Pricing</a>
          <a href={SITE.repo} target="_blank" rel="noopener">GitHub</a>
          <a href={SITE.npm} target="_blank" rel="noopener">npm</a>
        </nav>
      </footer>
    </div>
  );
}
