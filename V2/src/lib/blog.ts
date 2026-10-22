import "server-only";

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

/**
 * Blog posts: MDX files in content/blog, newest first. Every post's facts must
 * trace to the claim registry or a dated public artefact; the `source`
 * frontmatter field names it.
 */

const ROOT = join(process.cwd(), "content", "blog");

export interface Post {
  slug: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  source: string;
  body: string;
}

export function allPosts(): Post[] {
  let files: string[] = [];
  try {
    files = readdirSync(ROOT).filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
  return files
    .map((f) => {
      const { data, content } = matter(readFileSync(join(ROOT, f), "utf8"));
      return {
        slug: f.replace(/\.mdx$/, ""),
        title: String(data.title),
        summary: String(data.summary ?? ""),
        // YAML parses `2026-10-22` into a Date; keep it as an ISO day string.
        date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date),
        author: String(data.author ?? "Northwind Cipher"),
        source: String(data.source ?? ""),
        body: content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
