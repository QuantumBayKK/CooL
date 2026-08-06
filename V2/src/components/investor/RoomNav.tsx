"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Wordmark } from "@/components/shell/Wordmark";
import { Button } from "@/components/ui/button";
import { Collapse } from "@/components/ui/motion";
import { SECTION_GROUPS, VISIBLE_SECTIONS } from "@/content/investor-room";
import { cn } from "@/lib/utils";

/**
 * Room navigation.
 *
 * A sidebar on desktop, a collapsing bar on mobile. Grouped by the same four
 * headings the content module declares, so the nav cannot drift from the pages.
 *
 * The session expiry is shown rather than hidden. An investor part-way through
 * reading diligence deserves to know they have forty minutes left, not to
 * discover it by being bounced to the login screen mid-sentence.
 */
export function RoomNav({
  email,
  expiresAt,
}: {
  email: string | null;
  expiresAt: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function tick() {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("expired");
        // The session is dead server-side too; refreshing bounces to login
        // rather than leaving a shell the reader can click around in.
        router.refresh();
        return;
      }
      const mins = Math.floor(ms / 60_000);
      setRemaining(
        mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`,
      );
    }
    tick();
    // Every 30s: a minute-resolution countdown that updates once a minute can
    // sit visibly wrong for 59 seconds.
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  async function signOut() {
    await fetch("/api/investor/logout", { method: "POST" });
    router.push("/investor/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Investor room" className="flex flex-col gap-6">
      {SECTION_GROUPS.map((group) => {
        const items = VISIBLE_SECTIONS.filter((s) => s.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            <h2 className="text-label uppercase text-ink-subtle">{group}</h2>
            <ul className="mt-2 flex flex-col">
              {items.map((section) => {
                const href = `/investor/${section.slug}`;
                const active = pathname === href;
                return (
                  <li key={section.slug}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-[--radius-sm] px-2.5 py-1.5 text-sm",
                        "transition-colors duration-[--duration-state] ease-[--ease-out]",
                        active
                          ? "bg-raised text-ink"
                          : "text-ink-muted hover:bg-surface hover:text-ink",
                      )}
                    >
                      {section.title}
                      {section.state === "awaiting" && (
                        <span
                          className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-ink-subtle"
                          title="Container built; content not yet published"
                        >
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── mobile bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-line bg-canvas lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Wordmark />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-9 place-items-center rounded-[--radius-sm] text-ink-muted hover:bg-raised hover:text-ink"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        <Collapse open={open} className="border-t border-line">
          <div className="px-4 py-5">
            {nav}
            <Footer email={email} remaining={remaining} onSignOut={signOut} />
          </div>
        </Collapse>
      </div>

      {/* ── desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden w-[17rem] shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Link href="/investor/overview">
            <Wordmark />
          </Link>
        </div>
        <div data-scroll className="flex-1 overflow-y-auto px-4 py-6">
          {nav}
        </div>
        <div className="border-t border-line px-4 py-4">
          <Footer email={email} remaining={remaining} onSignOut={signOut} />
        </div>
      </aside>
    </>
  );
}

function Footer({
  email,
  remaining,
  onSignOut,
}: {
  email: string | null;
  remaining: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 lg:mt-0">
      <div>
        <p className="truncate text-xs text-ink">{email ?? "Invited guest"}</p>
        <p className="text-xs text-ink-subtle" data-numeric>
          {remaining === "expired"
            ? "Session expired"
            : remaining
              ? `Session ends in ${remaining}`
              : " "}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onSignOut}>
        <LogOut className="size-3.5" strokeWidth={2} />
        Sign out
      </Button>
    </div>
  );
}
