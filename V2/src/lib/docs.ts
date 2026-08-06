import "server-only";

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

/**
 * The documentation index.
 *
 * Docs are MDX files on disk rather than rows in a database. That is the right
 * shape for content that changes with the code: a doc that describes a flag
 * lands in the same commit and the same review as the flag, and it cannot get
 * out of step with a deploy.
 *
 * Everything here runs at build time. The reader receives static HTML and a
 * prebuilt search index; nothing about docs touches a server at request time.
 */

const ROOT = join(process.cwd(), "content", "docs");

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
}

export interface Doc extends DocMeta {
  body: string;
  headings: { id: string; text: string; level: 2 | 3 }[];
}

/** Section display order. Anything unlisted sorts last, alphabetically. */
const SECTION_ORDER = ["Start here", "Concepts", "Reference", "Operations"];

function walk(dir: string): string[] {
  let out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/**
 * Slugify a heading the same way the renderer does.
 *
 * Both sides must agree exactly or the table of contents links to anchors that
 * do not exist — a failure that looks like a broken page and is invisible in a
 * build log.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function allDocs(): Doc[] {
  let files: string[];
  try {
    files = walk(ROOT);
  } catch {
    return []; // no content dir yet
  }

  const docs = files.map((file) => {
    const raw = readFileSync(file, "utf8");
    const { data, content } = matter(raw);

    /*
     * `content/docs/foo/index.mdx` → "foo", and `content/docs/index.mdx` → "".
     *
     * The second case needs its own rule: a top-level index has no leading
     * slash to match, so a `/index$/` pattern alone leaves it as the literal
     * slug "index" and the docs home renders at /docs/index while /docs 404s.
     */
    const slug = file
      .slice(ROOT.length + 1)
      .replace(/\\/g, "/")
      .replace(/\.mdx$/, "")
      .replace(/(^|\/)index$/, "");

    // Headings for the on-page table of contents. Extracted from source rather
    // than from rendered output so the TOC is available without rendering.
    const headings = [...content.matchAll(/^(#{2,3})\s+(.+)$/gm)].map((m) => ({
      level: (m[1]!.length === 2 ? 2 : 3) as 2 | 3,
      text: m[2]!.trim(),
      id: slugifyHeading(m[2]!.trim()),
    }));

    return {
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      section: String(data.section ?? "Reference"),
      order: Number(data.order ?? 100),
      body: content,
      headings,
    } satisfies Doc;
  });

  return docs.sort((a, b) => {
    const sa = SECTION_ORDER.indexOf(a.section);
    const sb = SECTION_ORDER.indexOf(b.section);
    const ra = sa === -1 ? SECTION_ORDER.length : sa;
    const rb = sb === -1 ? SECTION_ORDER.length : sb;
    if (ra !== rb) return ra - rb;
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });
}

export function getDoc(slug: string): Doc | undefined {
  return allDocs().find((d) => d.slug === slug);
}

export function docSections(): { section: string; docs: DocMeta[] }[] {
  const grouped = new Map<string, DocMeta[]>();
  for (const doc of allDocs()) {
    const list = grouped.get(doc.section) ?? [];
    list.push(doc);
    grouped.set(doc.section, list);
  }
  return [...grouped.entries()].map(([section, docs]) => ({ section, docs }));
}

/**
 * The search index, built at compile time and shipped as JSON.
 *
 * Body text is stripped of MDX syntax and truncated to 1,200 characters per
 * doc. The whole index for a docs set this size is a few kB — smaller than the
 * JavaScript any hosted search widget would load, and it works offline, which
 * suits a product whose selling point is that verification works offline.
 */
export interface SearchEntry {
  slug: string;
  title: string;
  description: string;
  section: string;
  body: string;
}

export function searchIndex(): SearchEntry[] {
  return allDocs().map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    section: doc.section,
    body: doc.body
      .replace(/```[\s\S]*?```/g, " ") // fenced code
      .replace(/[#*_`>|\-]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → their text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1200),
  }));
}
