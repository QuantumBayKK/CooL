"use client";

import MiniSearch from "minisearch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, FileText, Search, X } from "lucide-react";

import type { SearchEntry } from "@/lib/docs";
import { cn } from "@/lib/utils";

/**
 * Docs search as a command palette.
 *
 * Opened from the header button, `⌘K` / `Ctrl K`, or `/`. Search is client-side
 * over the prebuilt index — `prefix` and `fuzzy` mean "attest" finds
 * "attestation" and "signture" still finds "signature", and the field boosts
 * keep a title match above a doc that merely mentions the word.
 */
export function DocsSearch({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const engine = useMemo(() => {
    const ms = new MiniSearch<SearchEntry>({
      fields: ["title", "description", "body"],
      storeFields: ["slug", "title", "description", "section"],
      idField: "slug",
      searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 4, description: 2 } },
    });
    ms.addAll(index);
    return ms;
  }, [index]);

  const results = useMemo(
    () => (query.trim().length < 2 ? [] : engine.search(query).slice(0, 8)),
    [query, engine],
  );

  // With no query the palette lists every page, so it doubles as a page jumper.
  const items = query.trim().length < 2
    ? index.map((e) => ({ slug: e.slug, title: e.title, section: e.section, text: e.description }))
    : results.map((r) => ({ slug: r.slug as string, title: r.title as string, section: r.section as string, text: excerpt(r.slug as string) }));

  function excerpt(slug: string) {
    const entry = index.find((item) => item.slug === slug);
    const text = `${entry?.description ?? ""} ${entry?.body ?? ""}`.trim();
    const terms = query.trim().split(/\s+/).filter(Boolean);
    const hit = terms.map((t) => text.toLowerCase().indexOf(t.toLowerCase())).find((at) => at >= 0) ?? 0;
    const start = Math.max(0, hit - 48);
    return `${start ? "…" : ""}${text.slice(start, start + 140)}${start + 140 < text.length ? "…" : ""}`;
  }

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function go(slug: string) {
    router.push(slug ? `/docs/${slug}` : "/docs");
    close();
  }

  return (
    <>
      <button type="button" className="docs-search-trigger" onClick={() => setOpen(true)} aria-label="Search documentation">
        <Search className="size-4" strokeWidth={1.8} aria-hidden />
        <span>Search docs</span>
        <kbd aria-hidden>⌘K</kbd>
      </button>

      {open && (
        <div className="docs-palette" role="dialog" aria-modal="true" aria-label="Search documentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="docs-palette-panel">
            <div className="docs-palette-input">
              <Search className="size-4 shrink-0 text-ink-subtle" strokeWidth={1.8} aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && items.length) { e.preventDefault(); setSelected((v) => (v + 1) % items.length); }
                  if (e.key === "ArrowUp" && items.length) { e.preventDefault(); setSelected((v) => (v - 1 + items.length) % items.length); }
                  if (e.key === "Enter" && items[selected]) { e.preventDefault(); go(items[selected]!.slug); }
                  if (e.key === "Escape") close();
                }}
                placeholder="Search the documentation…"
                aria-label="Search documentation"
                aria-controls="docs-palette-results"
                aria-activedescendant={items.length ? `docs-palette-item-${selected}` : undefined}
              />
              <button type="button" onClick={close} aria-label="Close search" className="docs-palette-close">
                <X className="size-4" strokeWidth={1.8} />
              </button>
            </div>

            <p aria-live="polite" className="sr-only">
              {query.trim().length >= 2 ? `${results.length} result${results.length === 1 ? "" : "s"}` : ""}
            </p>

            {items.length === 0 ? (
              <p className="docs-palette-empty">Nothing matches &ldquo;{query}&rdquo;.</p>
            ) : (
              <ul id="docs-palette-results" role="listbox" className="docs-palette-list">
                {query.trim().length < 2 && <li className="docs-palette-group" role="presentation">All pages</li>}
                {items.map((item, i) => (
                  <li key={item.slug || "home"} id={`docs-palette-item-${i}`} role="option" aria-selected={i === selected}>
                    <Link
                      href={item.slug ? `/docs/${item.slug}` : "/docs"}
                      onClick={close}
                      onMouseEnter={() => setSelected(i)}
                      className={cn("docs-palette-item", i === selected && "is-active")}
                    >
                      <FileText className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.6} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="docs-palette-title">{item.title}<em>{item.section}</em></span>
                        {item.text && <span className="docs-palette-text">{item.text}</span>}
                      </span>
                      {i === selected && <CornerDownLeft className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="docs-palette-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
              <span><kbd>↵</kbd> to open</span>
              <span><kbd>esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
