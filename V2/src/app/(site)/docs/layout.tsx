import { DocsNav } from "@/components/docs/DocsNav";
import { docSections, searchIndex } from "@/lib/docs";

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
    <div className="container-page">
      <div className="flex flex-col lg:flex-row lg:gap-12">
        <DocsNav sections={docSections()} index={searchIndex()} />
        <div className="min-w-0 flex-1 py-10 lg:py-14">{children}</div>
      </div>
    </div>
  );
}
