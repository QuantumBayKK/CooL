"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isFullBleed } from "@/lib/site";

/**
 * The crossfade at the end of a navigation.
 *
 * `key={pathname}` is the whole mechanism: React tears down the old subtree and
 * mounts the new one, the CSS animation on `[data-page-fade]` runs on mount,
 * and the new page arrives on `--ease-nav` instead of appearing between two
 * frames. Opacity and 6px — the same restraint as everything else here, applied
 * to the largest thing that moves.
 *
 * ── it does not cost the pages their server rendering ──
 *
 * `children` is a prop. A Server Component passed *through* a Client Component
 * is still rendered on the server; only this file's twenty lines ship. That is
 * the distinction the site layout's own comment warns about — wrapping the tree
 * in `AnimatePresence` would have made every route a Client Component, and a
 * crossfade is not worth a site's worth of streaming.
 *
 * ── and it stays off the instruments ──
 *
 * The full-bleed surfaces opt out. The walkthrough boots an evidence plane on
 * mount — real key derivation, four sealed records — and a fade is not worth
 * making anyone watch that twice. `isFullBleed` is the same list the
 * breadcrumbs and the footer gate read, so the three cannot disagree.
 */
export function PageFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isFullBleed(pathname)) return <>{children}</>;

  return (
    <div key={pathname} data-page-fade>
      {children}
    </div>
  );
}
