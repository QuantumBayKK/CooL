import type { Metadata } from "next";
import Link from "next/link";

import { HudFrame } from "@/components/film/HudFrame";
import { PageHead } from "@/components/film/SectionHead";
import { allPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Engineering notes and product updates from Northwind Cipher, the team building CooL.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = allPosts();
  return (
    <>
      <PageHead label="Blog" title="Engineering notes and updates." lead="How CooL is built, what we have proven, and what we have not — in that order." />
      <section className="f-section">
        <div className="f-wrap">
          <ul className="f-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {posts.map((p) => (
              <HudFrame as="li" key={p.slug} className="f-span-4 f-hud--fill">
                <Link href={`/blog/${p.slug}`} className="f-post">
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  <span className="f-tile-name">{p.title}</span>
                  <span className="f-body f-small">{p.summary}</span>
                  <span className="f-small" style={{ marginTop: "auto", color: "var(--brand)", fontWeight: 550 }}>
                    Read the post →
                  </span>
                </Link>
              </HudFrame>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
