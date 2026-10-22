import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { mdxComponents, mdxOptions } from "@/components/film/mdx";
import { allPosts, formatDate, getPost } from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.summary, url: `/blog/${post.slug}` },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <header className="f-pagehead">
        <div className="f-dots" aria-hidden="true" />
        <div className="f-wrap" style={{ position: "relative", maxWidth: 820 }}>
          <Link href="/blog" className="f-small" style={{ color: "var(--brand)", fontWeight: 550 }}>
            ← All posts
          </Link>
          <h1 className="f-h1" style={{ marginTop: 18, fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3rem)" }}>
            {post.title}
          </h1>
          <p className="f-lead" style={{ marginTop: 16 }}>
            {post.summary}
          </p>
          <p className="f-small f-muted" style={{ marginTop: 20 }}>
            <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.author}
          </p>
        </div>
      </header>
      <section className="f-section f-section--flush">
        <div className="f-wrap" style={{ maxWidth: 820 }}>
          <article className="f-prose">
            <MDXRemote source={post.body} components={mdxComponents} options={mdxOptions} />
          </article>
          {post.source && (
            <p className="f-small f-muted" style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
              Source: {post.source}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
