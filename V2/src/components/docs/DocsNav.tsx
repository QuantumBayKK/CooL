"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, ChevronDown, CircleHelp, Command, FileCode2, Fingerprint,
  GitBranch, KeyRound, Network, ShieldAlert, ShieldCheck, Terminal,
  Workflow, type LucideIcon,
} from "lucide-react";

import type { DocMeta } from "@/lib/docs";
import { cn } from "@/lib/utils";

const PAGE_ICONS: Record<string, LucideIcon> = {
  "": BookOpen,
  architecture: Network,
  attestation: Fingerprint,
  "cli-reference": Terminal,
  "license-faq": CircleHelp,
  limits: ShieldAlert,
  quickstart: Command,
  "receipt-format": FileCode2,
  "threat-model": ShieldCheck,
  "verifier-reference": KeyRound,
  "verify-it-yourself": Workflow,
  witness: GitBranch,
};

function PageIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = PAGE_ICONS[slug] ?? BookOpen;
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}

/** Docs sidebar: collapsible sections, current page marked. Search lives in the header palette. */
export function DocsNav({
  sections,
}: {
  sections: { section: string; docs: DocMeta[] }[];
}) {
  const pathname = usePathname();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const current = sections.flatMap((s) => s.docs).find((doc) => pathname === (doc.slug ? `/docs/${doc.slug}` : "/docs"));

  return (
    <aside className="docs-nav">
      {/* Below `lg` the tree folds behind one button that names the current page. */}
      <button
        type="button"
        className="docs-browse-toggle lg:hidden"
        aria-expanded={browseOpen}
        onClick={() => setBrowseOpen((value) => !value)}
      >
        <span className="flex items-center gap-2.5">
          <PageIcon slug={current?.slug ?? ""} className="size-4 shrink-0" />
          <span>
            <span className="block text-[11px] text-ink-subtle">Browse documentation</span>
            <span className="mt-0.5 block font-medium">{current?.title ?? "All guides"}</span>
          </span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 text-ink-subtle transition-transform duration-200", browseOpen && "rotate-180")} />
      </button>
      <div className={cn("docs-tree", browseOpen && "docs-tree-open")}>
        <nav aria-label="Documentation">
          {sections.map(({ section, docs }) => {
            const id = `docs-section-${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            return (
              <div key={section} className="docs-nav-section">
                <button
                  type="button"
                  className="docs-section-toggle"
                  aria-expanded={!collapsedSections[section]}
                  aria-controls={id}
                  onClick={() => setCollapsedSections((c) => ({ ...c, [section]: !c[section] }))}
                >
                  <span>{section}</span>
                  <ChevronDown className={cn("size-3.5 transition-transform", collapsedSections[section] && "-rotate-90")} aria-hidden="true" />
                </button>
                {!collapsedSections[section] && (
                  <ul id={id}>
                    {docs.map((doc) => {
                      const href = doc.slug ? `/docs/${doc.slug}` : "/docs";
                      const active = pathname === href;
                      return (
                        <li key={doc.slug}>
                          <Link href={href} aria-current={active ? "page" : undefined} onClick={() => setBrowseOpen(false)} className="docs-nav-link">
                            <PageIcon slug={doc.slug} className="size-4 shrink-0" />
                            <span>{doc.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
