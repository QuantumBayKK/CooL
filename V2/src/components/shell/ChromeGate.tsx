"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isFullBleed } from "@/lib/site";

/**
 * Hides marketing chrome on the full-bleed surfaces.
 *
 * The `(site)` layout renders one header, one breadcrumb bar and one footer for
 * every route in the group, which is right for a dozen documents and wrong for
 * the walkthrough — a single-screen instrument that sizes itself to the
 * viewport and expects nothing stacked above or below it.
 *
 * `children` arrives as a prop, already rendered on the server. That is the
 * whole reason this is shaped as a wrapper rather than as a `useFullBleed()`
 * hook called inside the footer: a Server Component passed through a Client
 * Component stays a Server Component, so `SiteFooter` keeps rendering to static
 * HTML and this file ships only the pathname check.
 */
export function HideOnFullBleed({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isFullBleed(pathname)) return null;
  return <>{children}</>;
}
