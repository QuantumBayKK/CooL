"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * The navigation progress bar.
 *
 * ── why this exists ──
 *
 * The App Router keeps the current page on screen while the next one is
 * fetched. That is the right behaviour — it is why navigation here never
 * flashes white — but it has one cost: for the few hundred milliseconds between
 * the click and the swap, the interface looks like it ignored the click. On a
 * fast connection nobody notices. On a slow one people click twice.
 *
 * A 2px hairline across the top of the viewport is the smallest thing that
 * answers "I heard you". It creeps and then completes; it never sits full and
 * waiting, because a progress bar that finishes before the page does is worse
 * than none.
 *
 * ── how the start is detected ──
 *
 * By capturing clicks on same-origin links, not by a router event: the App
 * Router does not expose navigation-start, and `useLinkStatus` only reports for
 * the one `<Link>` it is rendered inside — thirty links would need thirty
 * subscriptions and would still miss `router.push`.
 *
 * The listener is capture-phase and passive-by-nature: it reads the event and
 * never calls `preventDefault`, so a modified click (new tab, download, target)
 * behaves exactly as it would without this component. Everything that is not
 * plainly an in-app navigation is filtered out, because a bar that appears on a
 * `mailto:` or a hash jump is a bar that appears at random.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── start ── */
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Modified clicks are the browser's to handle, not ours.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // Same page, different anchor: the browser scrolls, nothing loads.
      if (url.pathname === window.location.pathname && url.hash) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      setState("loading");
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  /* ── finish ──
     The pathname changing is the navigation committing. `done` runs the bar to
     full and fades it, then the timer returns it to `idle` so the next
     navigation starts from zero rather than from wherever the last one
     stopped. */
  useEffect(() => {
    setState((prev) => (prev === "loading" ? "done" : prev));
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => setState("idle"), 520);
    return () => {
      if (settle.current) clearTimeout(settle.current);
    };
  }, [pathname]);

  if (state === "idle") return null;

  return (
    <div
      className="nav-progress"
      data-state={state}
      // Decorative. The page's own content announces the new route, and a live
      // region that fired on every link would talk over it.
      aria-hidden
    />
  );
}
