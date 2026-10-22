import { DocsSidebar } from "@/components/film/DocsSidebar";
import { docSections } from "@/lib/docs";

/**
 * Docs shell: a sticky section sidebar on desktop, a collapsible index on
 * phones. Everything is computed at build time from content/docs/*.mdx.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const sections = docSections().map((s) => ({
    section: s.section,
    docs: s.docs.map((d) => ({ slug: d.slug, title: d.title })),
  }));
  return (
    <div className="f-docs f-wrap">
      <DocsSidebar sections={sections} />
      <div className="f-docs__main">{children}</div>
    </div>
  );
}
