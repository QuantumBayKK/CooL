"use client";

import MiniSearch from "minisearch";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import type { DocMeta, SearchEntry } from "@/lib/docs";
import { cn } from "@/lib/utils";

/**
 * Docs sidebar and search.
 *
 * Search is client-side over a prebuilt index. `prefix: true` and `fuzzy: 0.2`
 * mean "attest" finds "attestation" and "signture" still finds "signature" —
 * both matter for a docs set full of long technical terms that people half
 * remember and mistype.
 *
 * Field boosts put a title match above a body match. Without them, a doc that
 * merely mentions "receipt" outranks the doc actually called "Receipt format",
 * which is the single most common way docs search feels broken.
 */
export function DocsNav({
  sections,
  index,
}: {
  sections: { section: string; docs: DocMeta[] }[];
  index: SearchEntry[];
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const engine = useMemo(() => {
    const ms = new MiniSearch<SearchEntry>({
      fields: ["title", "description", "body"],
      storeFields: ["slug", "title", "description", "section"],
      idField: "slug",
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 4, description: 2 },
      },
    });
    ms.addAll(index);
    return ms;
  }, [index]);

  const results = useMemo(
    () => (query.trim().length < 2 ? [] : engine.search(query).slice(0, 8)),
    [query, engine],
  );

  // `/` focuses search, the convention every docs site shares. Ignored while
  // the user is already typing in a field, or `/` becomes unusable in prose.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setQuery("");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <aside className="lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:w-[16rem] lg:shrink-0 lg:overflow-y-auto lg:py-10">
      <div className="border-b border-line py-4 lg:border-0 lg:py-0">
        {/* ── search ──────────────────────────────────────────────────── */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle"
            strokeWidth={2}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs"
            aria-label="Search documentation"
            className={cn(
              "h-9 w-full rounded-[--radius-sm] border border-line-strong bg-canvas",
              "pl-8 pr-8 text-sm text-ink placeholder:text-ink-subtle",
              "transition-colors duration-[--duration-state] hover:border-ink-subtle",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          ) : (
            <kbd
              aria-hidden
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-[--radius-xs] border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-ink-subtle"
            >
              /
            </kbd>
          )}
        </div>

        {/* Result count is announced, so a screen-reader user knows the list
            changed without having to go and find it. */}
        <p aria-live="polite" className="sr-only">
          {query.trim().length >= 2
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : ""}
        </p>

        {query.trim().length >= 2 && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-ink-subtle">
                Nothing matches &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {results.map((r) => (
                  <li key={r.id as string}>
                    <Link
                      href={`/docs/${r.slug}`}
                      onClick={() => setQuery("")}
                      className="block rounded-[--radius-sm] px-2.5 py-2 hover:bg-surface"
                    >
                      <span className="block text-sm text-ink">{r.title}</span>
                      <span className="block text-xs text-ink-subtle">
                        {r.section}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── tree ──────────────────────────────────────────────────────── */}
      {query.trim().length < 2 && (
        <nav aria-label="Documentation" className="flex flex-col gap-6 py-6 lg:pt-8">
          {sections.map(({ section, docs }) => (
            <div key={section}>
              <h2 className="text-label uppercase text-ink-subtle">{section}</h2>
              <ul className="mt-2 flex flex-col">
                {docs.map((doc) => {
                  const href = doc.slug ? `/docs/${doc.slug}` : "/docs";
                  const active = pathname === href;
                  return (
                    <li key={doc.slug}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block border-l px-3 py-1.5 text-sm",
                          "transition-colors duration-[--duration-state] ease-[--ease-out]",
                          active
                            ? "border-accent text-ink"
                            : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                        )}
                      >
                        {doc.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </aside>
  );
}
