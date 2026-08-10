import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface Crumb {
  readonly label: string;
  /** Omit on the final crumb — the current page is not a link to itself. */
  readonly href?: string;
}

/**
 * Breadcrumbs, plus the `BreadcrumbList` structured data that makes them show
 * up under the result in search.
 *
 * Three details that are the whole reason to write this rather than inline a
 * few links:
 *
 * · The current page is `<span aria-current="page">`, not a link. A link to
 *   the page you are already on is a dead control that screen-reader users
 *   have to skip past on every page of the site.
 * · The separators are CSS-generated and `aria-hidden`. As real text they get
 *   announced — "Home chevron Product chevron Pricing" — which is noise
 *   attached to every single page.
 * · The JSON-LD is built from the same array as the visible trail, and always
 *   includes Home as position 1 even though the visible trail starts there
 *   too. Google discards a BreadcrumbList whose positions do not start at 1.
 */
export function Breadcrumbs({
  trail,
  className,
}: {
  trail: readonly Crumb[];
  className?: string;
}) {
  const full: Crumb[] = [{ label: "Home", href: "/" }, ...trail];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: full.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      // The final crumb carries no `item`: it is the page being viewed, and
      // Google's spec says the last element may omit it.
      ...(c.href ? { item: `${SITE.url}${c.href === "/" ? "" : c.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("py-3", className)}>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-subtle">
          {full.map((c, i) => {
            const last = i === full.length - 1;
            return (
              <li key={c.label} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight
                    aria-hidden
                    className="size-3 shrink-0 text-line-strong"
                    strokeWidth={2}
                  />
                )}
                {last || !c.href ? (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="transition-colors duration-[--duration-state] hover:text-ink"
                  >
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
