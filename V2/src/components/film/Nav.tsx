"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BOOKING_URL, REPO_URL } from "@/content/claims";
import { PRODUCTS } from "@/content/copy";

import { Icon, IconTile } from "./Icons";
import { RecorderMark, Wordmark } from "./RecorderMark";

const LINKS = [
  { href: "/evidence", label: "Evidence" },
  { href: "/developers", label: "Developers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/team", label: "Company" },
] as const;

const MORE = [
  { href: "/limits", label: "Limits" },
  { href: "/design-partners", label: "Design partners" },
  { href: "/docs", label: "Docs" },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const megaPanel = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [pathname]);

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
    const away = (e: MouseEvent) => {
      if (!mega) return;
      const t = e.target as Node;
      if (!megaPanel.current?.contains(t) && !megaBtn.current?.contains(t)) setMega(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("mousedown", away);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("mousedown", away);
    };
  }, [mega, mobile]);

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
      <header className={`f-nav${scrolled || mobile ? " is-scrolled" : ""}`}>
        <div className="f-nav__in">
          <Link href="/" className="f-brand" aria-label="CooL by Northwind Cipher — home">
            <RecorderMark className="f-brand__mark" />
            <Wordmark />
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
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d={mega ? "M1.5 6.5L5 3l3.5 3.5" : "M1.5 3.5L5 7l3.5-3.5"} />
                  </svg>
                </button>
              </li>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="f-nav__link" aria-current={current(l.href)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="f-nav__right">
            <a className="f-nav__gh" href={REPO_URL} target="_blank" rel="noopener" aria-label="cool-sdk on GitHub">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.34.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z" />
              </svg>
            </a>
            <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn f-btn--line">
              Book a demo
            </a>
            <Link href="/verify" className="f-btn">
              Verify a receipt
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
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                {mobile ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mega && (
        <div id="f-mega" ref={megaPanel} className="f-mega" role="region" aria-label="Product">
          <div className="f-mega__grid">
            {PRODUCTS.map((p) => (
              <Link key={p.id} href={p.href} className="f-mega__item">
                <IconTile name={p.id} />
                <span className="f-h3">{p.name}</span>
                <span className="f-small">{p.body}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobile && (
        <div id="f-overlay" ref={overlay} className="f-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <p className="f-label" style={{ marginTop: 8 }}>
            Product
          </p>
          {PRODUCTS.map((p) => (
            <Link key={p.id} href={p.href}>
              {p.name}
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
          ))}
          <p className="f-label f-overlay__group">Company</p>
          {[{ href: "/verify", label: "Verify a receipt" }, ...LINKS, ...MORE].map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
          ))}
          <a href={REPO_URL} target="_blank" rel="noopener">
            GitHub
            <Icon name="external" className="f-btn__arrow" />
          </a>
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn">
            Book a demo
          </a>
        </div>
      )}
    </>
  );
}
