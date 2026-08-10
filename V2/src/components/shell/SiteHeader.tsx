"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Collapse } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shell/Wordmark";
import { isGroup, NAV, type NavGroup, type NavItem } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Primary navigation.
 *
 * Sticky, 64px, hairline bottom border, and no background blur. Blur is the
 * default reflex for a sticky header and it is wrong here for two reasons: it
 * is the glassmorphism the brief rules out, and it costs a compositor layer on
 * every scroll frame — which is felt on exactly the mid-range Android hardware
 * that the Lighthouse target is measured on.
 *
 * The header is opaque instead. Content scrolling under an opaque bar is
 * legible; content scrolling under a blurred one is a smear.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Any navigation closes everything. Without this the mobile sheet survives a
  // route change and the reader lands on a new page still looking at the menu.
  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  // Escape closes the open dropdown, and a click outside closes it too. Both
  // are expected of a menu; missing either makes the header feel broken in a
  // way readers notice but do not report.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    }
    function onPointer(e: PointerEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas">
      <nav ref={navRef} className="container-page" aria-label="Primary">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="CooL — home"
          >
            <Wordmark />
          </Link>

          {/* ── desktop ───────────────────────────────────────────────── */}
          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) =>
              isGroup(item) ? (
                <DesktopGroup
                  key={item.label}
                  group={item}
                  open={open === item.label}
                  onToggle={() =>
                    setOpen(open === item.label ? null : item.label)
                  }
                  activeHref={active}
                />
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex h-8 items-center rounded-[--radius-sm] px-3 text-sm",
                      "transition-colors duration-[--duration-state] ease-[--ease-out]",
                      active(item.href)
                        ? "text-ink"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
              <Link href="/docs/quickstart">Get started</Link>
            </Button>
            <Button asChild size="sm" className="hidden lg:inline-flex">
              <Link href="/contact">Talk to us</Link>
            </Button>

            <button
              type="button"
              className="grid size-9 place-items-center rounded-[--radius-sm] text-ink-muted hover:bg-raised hover:text-ink lg:hidden"
              aria-label={mobile ? "Close menu" : "Open menu"}
              aria-expanded={mobile}
              onClick={() => setMobile((v) => !v)}
            >
              {mobile ? (
                <X className="size-5" strokeWidth={1.75} />
              ) : (
                <Menu className="size-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── mobile sheet ─────────────────────────────────────────────────
          In-flow rather than an overlay: it pushes the page instead of
          covering it, so the browser's own scroll still works and there is no
          scroll-lock to get wrong. */}
      <Collapse open={mobile} className="border-t border-line lg:hidden">
        <div className="container-page py-4">
          <ul className="flex flex-col">
            {NAV.map((item) =>
              isGroup(item) ? (
                <li key={item.label} className="border-b border-line py-3">
                  <p className="text-label uppercase text-ink-subtle">
                    {item.label}
                  </p>
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {item.items.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          className="block py-1.5 text-sm text-ink-muted hover:text-ink"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.href} className="border-b border-line">
                  <Link
                    href={item.href}
                    className="block py-3 text-sm text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <div className="mt-5 flex items-center gap-3">
            <Button asChild size="sm" className="flex-1">
              <Link href="/contact">Talk to us</Link>
            </Button>
            <Button asChild size="sm" variant="secondary" className="flex-1">
              <Link href="/docs/quickstart">Get started</Link>
            </Button>
          </div>
        </div>
      </Collapse>
    </header>
  );
}

/* ── desktop dropdown ─────────────────────────────────────────────────────── */

function DesktopGroup({
  group,
  open,
  onToggle,
  activeHref,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  activeHref: (href: string) => boolean;
}) {
  const anyActive = group.items.some((i) => activeHref(i.href));

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-[--radius-sm] px-3 text-sm",
          "transition-colors duration-[--duration-state] ease-[--ease-out]",
          anyActive || open ? "text-ink" : "text-ink-muted hover:text-ink",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-[--duration-state] ease-[--ease-out]",
            open && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      <Collapse
        open={open}
        className="absolute left-0 top-[calc(100%+0.5rem)] w-[22rem]"
      >
        <ul className="border border-line bg-canvas p-1.5 shadow-[--shadow-overlay]">
          {group.items.map((item) => (
            <DropdownItem key={item.href} item={item} active={activeHref(item.href)} />
          ))}
        </ul>
      </Collapse>
    </li>
  );
}

function DropdownItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "block rounded-[--radius-sm] px-3 py-2.5",
          "transition-colors duration-[--duration-state] ease-[--ease-out]",
          active ? "bg-raised" : "hover:bg-surface",
        )}
      >
        <span className="block text-sm font-medium text-ink">{item.label}</span>
        {item.description && (
          <span className="mt-0.5 block text-xs text-ink-subtle">
            {item.description}
          </span>
        )}
      </Link>
    </li>
  );
}
