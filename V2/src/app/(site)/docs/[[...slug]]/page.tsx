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

  return (
    <div className="flex flex-col gap-10 xl:flex-row xl:gap-12">
      <article className="min-w-0 flex-1">
        <p className="text-label uppercase text-ink-subtle">{doc.section}</p>
        <h1 className="mt-3 text-h1">{doc.title}</h1>
        {doc.description && (
          <p className="mt-3 max-w-prose text-lead text-ink-muted">
            {doc.description}
          </p>
        )}

        <div className="prose-cool mt-10">
          <MDXRemote source={doc.body} components={components} />
        </div>
      </article>

      {/* ── on this page ────────────────────────────────────────────────
          Hidden below xl rather than collapsed into an accordion: a table of
          contents that costs a tap to open is a table of contents nobody
          opens, and the headings are already in the document below. */}
      {doc.headings.length > 2 && (
        <nav
          aria-label="On this page"
          className="hidden w-[13rem] shrink-0 xl:block"
        >
          <div className="sticky top-24">
            <p className="text-label uppercase text-ink-subtle">On this page</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {doc.headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "pl-3" : undefined}>
                  <Link
                    href={`#${h.id}`}
                    className="block text-xs text-ink-muted hover:text-ink"
                  >
                    {h.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
