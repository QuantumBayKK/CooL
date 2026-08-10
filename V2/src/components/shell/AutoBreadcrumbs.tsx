"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs, type Crumb } from "@/components/shell/Breadcrumbs";
import { Container } from "@/components/ui/primitives";
import { FOOTER, isGroup, NAV } from "@/lib/site";

/**
 * Breadcrumbs for every page, derived from the URL, mounted once.
 *
 * The alternative was a `<Breadcrumbs trail={…} />` in each of a dozen page
 * files. That works until someone renames a route, at which point half the
 * trails point at a 404 and nothing fails to build — the classic way
 * breadcrumbs rot. Deriving the trail from `usePathname()` and resolving the
 * labels from the navigation registry means a renamed route updates its own
 * breadcrumb, and a route with no registered label is obvious rather than
 * silently wrong.
 *
 * ── where the labels come from ──
 *
 * `NAV` and `FOOTER` already name every public route, for the header and
 * footer respectively, so they are flattened into one lookup. Anything not
 * found there — a docs slug, mostly — is title-cased from the segment, which
 * turns `/docs/receipt-format` into "Receipt format". That is a fallback and
 * it reads acceptably; it is not a substitute for registering a label.
 *
 * ── where they do not appear ──
 *
 * Not on the homepage: a trail reading just "Home" is noise. Not on the
 * full-bleed evidence surfaces or the private rooms, which have their own
 * chrome and where a marketing breadcrumb above a console is clutter.
 */

const SUPPRESS = ["/", "/billboard", "/console", "/studio", "/investor", "/admin"];

/** `{ "/security/readiness": "Readiness" }` for every route the nav names. */
function labelRegistry(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const item of NAV) {
    if (isGroup(item)) {
      for (const sub of item.items) map[sub.href] = sub.label;
    } else {
      map[item.href] = item.label;
    }
  }
  for (const group of FOOTER) {
    for (const item of group.items) {
      // Footer carries external links and hash targets too; neither is a page.
      if (item.href.startsWith("/") && !item.href.includes("#")) {
        map[item.href] ??= item.label;
      }
    }
  }

  // Intermediate segments that are real pages but are not linked from the nav
  // under that exact path, plus the two pages added later.
  map["/docs"] ??= "Documentation";
  map["/security"] ??= "Security model";
  map["/privacy"] ??= "Privacy policy";
  map["/thank-you"] ??= "Thanks";
  map["/pipeline"] ??= "The pipeline";

  return map;
}

function titleCase(segment: string) {
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function AutoBreadcrumbs() {
  const pathname = usePathname();

  if (SUPPRESS.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)))) {
    return null;
  }

  const labels = labelRegistry();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const trail: Crumb[] = segments.map((segment, i) => {
    const href = `/${segments.slice(0, i + 1).join("/")}`;
    const last = i === segments.length - 1;
    return {
      label: labels[href] ?? titleCase(segment),
      // The final crumb is the current page and must not be a link — see the
      // note in `Breadcrumbs`.
      ...(last ? {} : { href }),
    };
  });

  return (
    <Container>
      <Breadcrumbs trail={trail} className="border-b border-line" />
    </Container>
  );
}
