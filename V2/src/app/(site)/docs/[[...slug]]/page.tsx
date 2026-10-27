import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { CodeBlock } from "@/components/ui/code";
import { StatusBadge } from "@/components/ui/primitives";
import { allDocs, getDoc, slugifyHeading } from "@/lib/docs";

export const dynamicParams = false;

/**
 * Every doc, prerendered.
 *
 * `dynamicParams = false` means a URL that is not in this list 404s at the edge
 * rather than attempting a render — so a stale link cannot produce a
 * server-rendered error page.
 */
export function generateStaticParams() {
  return allDocs().map((doc) => ({
    slug: doc.slug ? doc.slug.split("/") : [],
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc((slug ?? []).join("/"));
  if (!doc) return { title: "Not found" };
  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}`.replace(/\/$/, "") },
  };
}

/**
 * MDX component overrides.
 *
 * Headings get ids matching `slugifyHeading` so the table of contents resolves.
 * Code fences route through the same Shiki block the rest of the site uses, so
 * a snippet in the docs and a snippet on the homepage are highlighted by one
 * implementation with one theme pair.
 */
const components = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={slugifyHeading(String(children))}>{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 id={slugifyHeading(String(children))}>{children}</h3>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => {
    // MDX gives <pre><code className="language-x">…</code></pre>. Unwrap it and
    // hand the raw source to the shared highlighter.
    const child = children as
      | { props?: { className?: string; children?: string } }
      | undefined;
    const className = child?.props?.className ?? "";
    const lang = /language-(\w+)/.exec(className)?.[1] ?? "text";
    const code = String(child?.props?.children ?? "");
    return <CodeBlock lang={lang} code={code} className="my-6" />;
  },
  Note: ({ children }: { children?: React.ReactNode }) => (
    <aside className="my-6 border border-line bg-surface p-4">
      <StatusBadge status="neutral">Note</StatusBadge>
      <div className="mt-2.5 text-sm text-ink-muted">{children}</div>
    </aside>
  ),
  Warning: ({ children }: { children?: React.ReactNode }) => (
    <aside className="my-6 border border-warn/30 bg-warn-wash p-4">
      <StatusBadge status="warn">Important</StatusBadge>
      <div className="mt-2.5 text-sm text-ink-muted">{children}</div>
    </aside>
  ),
  // A link grid for a landing page's "where to go next" — reuses the same
  // bordered, shadowless cell pattern as the architecture page's topology
  // grid (`rule-grid`-shaped: hairlines from a `gap-px bg-line` track rather
  // than a card component), so a docs index doesn't invent a second visual
  // language for "here are some things you can click".
  Grid: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-8 grid gap-px bg-line sm:grid-cols-2">{children}</div>
  ),
  CardLink: ({ href, title, desc }: { href: string; title: string; desc: string }) => (
    <Link
      href={href}
      className="group block bg-canvas p-5 transition-colors duration-[--duration-state] ease-[--ease-out] hover:bg-surface"
    >
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm text-ink-muted">{desc}</span>
    </Link>
  ),
};

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const doc = getDoc((slug ?? []).join("/"));
  if (!doc) notFound();
  const docs = allDocs();
  const currentIndex = docs.findIndex((item) => item.slug === doc.slug);
  const previous = docs[currentIndex - 1];
  const next = docs[currentIndex + 1];
  const targetHref = doc.slug ? `/docs/${doc.slug}` : "/docs";
  const backlinks = docs
    .filter((item) => item.slug !== doc.slug && (item.body.includes(`](${targetHref})`) || item.body.includes(`](${targetHref}#`)))
    .slice(0, 4);

  return (
    <div className="docs-reading flex flex-col gap-10 xl:flex-row xl:gap-12">
      <article className="docs-article min-w-0 flex-1">
        <div className="docs-eyebrow"><span>{doc.section}</span><span aria-hidden>·</span><span>Documentation</span></div>
        <h1 className="docs-title">{doc.title}</h1>
        {doc.description && (
          <p className="docs-description max-w-prose text-lead text-ink-muted">
            {doc.description}
          </p>
        )}

        <div className="prose-cool docs-prose">
          <MDXRemote source={doc.body} components={components} />
        </div>

        {(backlinks.length > 0 || previous || next) && (
          <footer className="docs-footer">
            {backlinks.length > 0 && (
              <section aria-labelledby="docs-backlinks-title" className="docs-backlinks">
                <div className="docs-footer-heading"><span className="docs-link-mark" aria-hidden>↗</span><h2 id="docs-backlinks-title">Linked from</h2></div>
                <div className="docs-backlink-list">
                  {backlinks.map((item) => (
                    <Link className="docs-backlink" href={item.slug ? `/docs/${item.slug}` : "/docs"} key={item.slug}>
                      <span><span className="docs-backlink-section">{item.section}</span><span className="docs-backlink-title">{item.title}</span></span>
                      <span aria-hidden className="docs-link-arrow">↗</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {(previous || next) && (
              <nav className="docs-pagination" aria-label="More documentation">
                {previous ? <Link href={previous.slug ? `/docs/${previous.slug}` : "/docs"} className="docs-page-link docs-page-prev"><span className="docs-page-direction">← Previous</span><span>{previous.title}</span></Link> : <span />}
                {next ? <Link href={next.slug ? `/docs/${next.slug}` : "/docs"} className="docs-page-link docs-page-next"><span className="docs-page-direction">Next →</span><span>{next.title}</span></Link> : <span />}
              </nav>
            )}
          </footer>
        )}
      </article>

      {/* ── on this page ────────────────────────────────────────────────
          Hidden below xl rather than collapsed into an accordion: a table of
          contents that costs a tap to open is a table of contents nobody
          opens, and the headings are already in the document below. */}
      {doc.headings.length > 2 && (
        <nav
          aria-label="On this page"
          className="docs-toc hidden w-[13rem] shrink-0 xl:block"
        >
          <div className="sticky top-24">
            <p className="text-label uppercase text-ink-subtle">On this page</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {doc.headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "pl-3" : undefined}>
                  <Link
                    href={`#${h.id}`}
                    className="docs-toc-link block text-xs text-ink-muted hover:text-ink"
                  >
                    {h.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      {doc.headings.length > 2 && (
        <details className="docs-mobile-toc">
          <summary><span>On this page</span><span aria-hidden>⌄</span></summary>
          <nav aria-label="On this page">
            {doc.headings.map((heading) => <Link key={heading.id} href={`#${heading.id}`} className={heading.level === 3 ? "is-subheading" : undefined}>{heading.text}</Link>)}
          </nav>
        </details>
      )}
    </div>
  );
}
