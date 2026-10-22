import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { mdxComponents as components, mdxOptions } from "@/components/film/mdx";
import { allDocs, getDoc } from "@/lib/docs";

export const dynamicParams = false;

export function generateStaticParams() {
  return allDocs().map((doc) => ({ slug: doc.slug ? doc.slug.split("/") : [] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc((slug ?? []).join("/"));
  if (!doc) return { title: "Not found" };
  return {
    title: `${doc.title} · Docs`,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}`.replace(/\/$/, "") },
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const doc = getDoc((slug ?? []).join("/"));
  if (!doc) notFound();

  const docs = allDocs();
  const i = docs.findIndex((d) => d.slug === doc.slug);
  const prev = i > 0 ? docs[i - 1] : undefined;
  const next = i < docs.length - 1 ? docs[i + 1] : undefined;
  const href = (s: string) => (s ? `/docs/${s}` : "/docs");

  return (
    <div className="f-docs__page">
      <article className="f-prose">
        <p className="f-label" style={{ color: "var(--brand)" }}>
          {doc.section}
        </p>
        <h1 className="f-h1" style={{ marginTop: 10, fontSize: "clamp(2rem, 1.4rem + 1.8vw, 2.75rem)" }}>
          {doc.title}
        </h1>
        {doc.description && <p className="f-lead">{doc.description}</p>}
        <MDXRemote source={doc.body} components={components} options={mdxOptions} />

        <nav className="f-docs__pager" aria-label="Previous and next">
          {prev ? (
            <Link href={href(prev.slug)} className="f-hud">
              <span className="f-label">Previous</span>
              <span className="f-h3">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={href(next.slug)} className="f-hud" style={{ textAlign: "right" }}>
              <span className="f-label">Next</span>
              <span className="f-h3">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>

      {doc.headings.length > 2 && (
        <nav aria-label="On this page" className="f-docs__toc">
          <p className="f-docs__heading">On this page</p>
          <ul>
            {doc.headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: h.level === 3 ? 12 : 0 }}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
