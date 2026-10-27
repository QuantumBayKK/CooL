/**
 * GitHub docs mirror.
 *
 * The published docs live as MDX in `content/docs/` and render through
 * `next-mdx-remote` with custom components (`Note`, `Warning`, `Grid`,
 * `CardLink`) and the site's Shiki code blocks. None of that renders on
 * github.com, which shows a repo's files as plain GitHub-flavoured Markdown
 * with no React runtime. Rather than hand-write and hand-sync a second copy,
 * this generates one from the same source MDX feeds the live site, so a doc
 * edit cannot update one surface and silently skip the other.
 *
 * Run: node scripts/generate-docs-mirror.mjs
 * Writes: ../docs/*.md (repo root, next to this project's own README)
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(PROJECT_ROOT, "content", "docs");
const OUT = join(PROJECT_ROOT, "..", "docs");
const SITE_ORIGIN = "https://northwindcipher.com";

/** `/docs/foo` → `foo.md`; `/docs` → `README.md`; anything else → absolute. */
function rewriteLink(href) {
  if (href === "/docs") return "README.md";
  const doc = href.match(/^\/docs\/([^#]+)(#.+)?$/);
  if (doc) return `${doc[1]}.md${doc[2] ?? ""}`;
  if (href.startsWith("/")) return `${SITE_ORIGIN}${href}`;
  return href;
}

function rewriteLinks(body) {
  return body.replace(/\]\(([^)]+)\)/g, (match, href) => `](${rewriteLink(href)})`);
}

/** `<Warning>…</Warning>` / `<Note>…</Note>` → GitHub Markdown alert blockquotes. */
function convertAsides(body) {
  return body
    .replace(/<Warning>\n([\s\S]*?)\n<\/Warning>/g, (_match, inner) => toAlert("IMPORTANT", inner))
    .replace(/<Note>\n([\s\S]*?)\n<\/Note>/g, (_match, inner) => toAlert("NOTE", inner));
}

function toAlert(kind, inner) {
  const lines = inner.trim().split("\n");
  return [`> [!${kind}]`, ...lines.map((line) => `> ${line}`)].join("\n");
}

/** `<Grid><CardLink href=".." title=".." desc=".." />…</Grid>` → a plain list. */
function convertCardGrid(body) {
  return body.replace(/<Grid>\n([\s\S]*?)\n<\/Grid>/g, (_match, inner) => {
    const cards = [...inner.matchAll(/<CardLink href="([^"]+)" title="([^"]+)" desc="([^"]+)" \/>/g)];
    return cards
      .map(([, href, title, desc]) => `- **[${title}](${rewriteLink(href)})** — ${desc}`)
      .join("\n");
  });
}

function convert(file) {
  // Some source files carry CRLF line endings (an untouched file keeps
  // whatever it was checked out with); every regex below assumes `\n`, so
  // normalise once, up front, rather than making each one CRLF-aware.
  const raw = readFileSync(join(SOURCE, file), "utf8").replace(/\r\n/g, "\n");
  const { data, content } = matter(raw);

  let body = content.trim();
  body = convertCardGrid(body);
  body = convertAsides(body);
  body = rewriteLinks(body);

  const title = String(data.title ?? file.replace(/\.mdx$/, ""));
  const description = data.description ? `*${data.description}*\n\n` : "";

  return `# ${title}\n\n${description}${body}\n`;
}

mkdirSync(OUT, { recursive: true });

const files = readdirSync(SOURCE).filter((name) => name.endsWith(".mdx"));
for (const file of files) {
  const outName = file === "index.mdx" ? "README.md" : file.replace(/\.mdx$/, ".md");
  writeFileSync(join(OUT, outName), convert(file));
}

console.log(`  wrote ${files.length} file(s) to docs/`);
