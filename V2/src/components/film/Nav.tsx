"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PRODUCTS } from "@/content/copy";
import { REPO_URL } from "@/content/claims";

import { RecorderMark } from "./RecorderMark";

const LINKS = [
  { href: "/evidence", label: "Evidence" },
  { href: "/verify", label: "Verify" },
  { href: "/developers", label: "Developers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/team", label: "Team" },
] as const;

const ICONS: Record<string, React.ReactNode> = {
  receipts: <path d="M8 4h16v24l-4-2-4 2-4-2-4 2zM12 10h8M12 14h8M12 18h5" />,
  verifier: <path d="M5 16l7 7L27 8M4 4h24v24H4z" />,
  attestation: <path d="M10 4h12v6H10zM6 10h20v18H6zM12 16h8v6h-8zM16 4V2" />,
  log: <path d="M16 4v6M16 10l-7 8M16 10l7 8M9 18v6M23 18v6M6 24h6v4H6zM20 24h6v4h-6zM13 2h6v4h-6z" />,
};

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const megaPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(scrollY > 40);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [pathname]);

  // Escape closes, and focus returns to the control that opened the menu.
  useEffect(() => {
    if (!mega && !mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobile) {
        setMobile(false);
        burger.current?.focus();
      } else {
        setMega(false);
        megaBtn.current?.focus();
      }
    };
    const onClickAway = (e: MouseEvent) => {
      if (!mega) return;
      const t = e.target as Node;
      if (!megaPanel.current?.contains(t) && !megaBtn.current?.contains(t)) setMega(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("mousedown", onClickAway);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("mousedown", onClickAway);
    };
  }, [mega, mobile]);

  // Mobile overlay: lock scroll, move focus in, trap Tab inside.
  useEffect(() => {
    if (!mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = overlay.current;
    el?.querySelector<HTMLElement>("a")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const items = [burger.current, ...el.querySelectorAll<HTMLElement>("a")].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = prev;
      removeEventListener("keydown", trap);
    };
  }, [mobile]);

  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);

  return (
    <>
      <header className={`f-nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="f-nav__in">
          <Link href="/" className="f-brand" aria-label="Northwind Cipher · CooL — home">
            <RecorderMark className="f-brand__mark" />
            <span className="f-brand__word" aria-hidden="true">
              CooL
            </span>
          </Link>

          <nav aria-label="Primary">
            <ul className="f-nav__links">
              <li>
                <button
                  ref={megaBtn}
                  type="button"
                  className="f-nav__link"
                  aria-expanded={mega}
                  aria-controls="f-mega"
                  onClick={() => setMega((v) => !v)}
                >
                  Product
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="none" stroke="currentColor">
                    <path d={mega ? "M1 7l4-4 4 4" : "M1 3l4 4 4-4"} />
                  </svg>
                </button>
              </li>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="f-nav__link" aria-current={current(l.href)} data-impact="small">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="f-nav__right">
            <a className="f-nav__gh" href={REPO_URL} target="_blank" rel="noopener" aria-label="cool-sdk on GitHub">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.34.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z" />
              </svg>
            </a>
            <Link href="/verify" className="f-btn" data-impact="full">
              Run the verifier
            </Link>
            <button
              ref={burger}
              type="button"
              className="f-burger"
              aria-expanded={mobile}
              aria-controls="f-overlay"
              aria-label={mobile ? "Close menu" : "Open menu"}
              onClick={() => setMobile((v) => !v)}
            >
              {mobile ? "CLOSE" : "MENU"}
            </button>
          </div>
        </div>
      </header>

      {mega && (
        <div id="f-mega" ref={megaPanel} className="f-mega" role="region" aria-label="Product">
          <div className="f-wrap f-mega__grid">
            {PRODUCTS.map((p) => (
              <Link key={p.id} href={p.href} className="f-mega__item" data-impact="small">
                <svg className="f-mega__icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                  {ICONS[p.id]}
                </svg>
                <span className="f-label">[ {p.index} ]</span>
                <span className="f-h3">{p.name}</span>
                <span className="f-small f-muted">{p.body}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobile && (
        <div id="f-overlay" ref={overlay} className="f-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <Link href="/">Home</Link>
          {PRODUCTS.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.name}
            </Link>
          ))}
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
            </Link>
          ))}
          <Link href="/limits">Limits</Link>
          <Link href="/security">Security</Link>
          <a href={REPO_URL} target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </div>
      )}
    </>
  );
}
