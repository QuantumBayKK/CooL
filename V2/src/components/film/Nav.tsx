"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon, IconTile } from "./Icons";
import { RecorderMark, Wordmark } from "./RecorderMark";

type Item = { href: string; label: string; desc: string; icon: string };

const PLATFORM: readonly Item[] = [
  { href: "/platform-tour", label: "Platform tour", desc: "See CooL capture, seal and verify", icon: "layers" },
  { href: "/deploy/phala", label: "Deploy on Phala", desc: "Intel TDX confidential VMs via dstack", icon: "cpu" },
  { href: "/security", label: "Security", desc: "Trust model, evidence and limits", icon: "verifier" },
];

const RESOURCES: readonly Item[] = [
  { href: "/blog", label: "Blog", desc: "Engineering notes and updates", icon: "receipts" },
  { href: "/faq", label: "FAQ", desc: "Common questions answered", icon: "eye" },
  { href: "/about", label: "About", desc: "The team behind Northwind Cipher", icon: "users" },
];

const LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
] as const;

type Menu = "platform" | "resources" | null;

function setTheme(t: "light" | "dark") {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("nw-theme", t);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
}

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});
  const panel = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setAnnounce(document.querySelector(".film")?.classList.contains("has-announce") ?? false);
    const on = () => setScrolled(scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setMenu(null);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu && !mobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobile) {
        setMobile(false);
        burger.current?.focus();
      } else if (menu) {
        btns.current[menu]?.focus();
        setMenu(null);
      }
    };
    const away = (e: MouseEvent) => {
      if (!menu) return;
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btns.current[menu]?.contains(t)) setMenu(null);
    };
    addEventListener("keydown", onKey);
    addEventListener("mousedown", away);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("mousedown", away);
    };
  }, [menu, mobile]);

  useEffect(() => {
    if (!mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = overlay.current;
    el?.querySelector<HTMLElement>("a")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const items = [burger.current, ...el.querySelectorAll<HTMLElement>("a, button")].filter(Boolean) as HTMLElement[];
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

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setDark(!dark);
  };

  const dismiss = () => {
    document.querySelector(".film")?.classList.remove("has-announce");
    setAnnounce(false);
    try {
      localStorage.setItem("nw-announce", "dismissed");
    } catch {
      /* fine */
    }
  };

  const current = (href: string) => (pathname === href || pathname.startsWith(href + "/") ? "page" : undefined);
  const items = menu === "platform" ? PLATFORM : menu === "resources" ? RESOURCES : [];

  const dropdown = (key: "platform" | "resources", label: string) => (
    <button
      ref={(el) => {
        btns.current[key] = el;
      }}
      type="button"
      className="f-nav__link"
      aria-expanded={menu === key}
      aria-controls="f-mega"
      onClick={() => setMenu((m) => (m === key ? null : key))}
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d={menu === key ? "M1.5 6.5L5 3l3.5 3.5" : "M1.5 3.5L5 7l3.5-3.5"} />
      </svg>
    </button>
  );

  return (
    <>
      {announce && (
        <div className="f-announce" role="region" aria-label="Announcement">
          <span>
            Northwind Cipher is a member of the NVIDIA Inception Program. <Link href="/about">Learn more</Link>
          </span>
          <button type="button" onClick={dismiss} aria-label="Dismiss announcement">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>
      )}

      <header className={`f-nav${scrolled || mobile ? " is-scrolled" : ""}`}>
        <div className="f-nav__in">
          <Link href="/" className="f-brand" aria-label="CooL by Northwind Cipher — home">
            <RecorderMark className="f-brand__mark" />
            <Wordmark />
          </Link>

          <nav aria-label="Primary">
            <ul className="f-nav__links">
              <li>{dropdown("platform", "Platform")}</li>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="f-nav__link" aria-current={current(l.href)}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>{dropdown("resources", "Resources")}</li>
            </ul>
          </nav>

          <div className="f-nav__right">
            <button type="button" className="f-theme" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
              {dark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
                </svg>
              )}
            </button>
            <Link href="/studio" className="f-nav__link f-nav__studio">
              Studio
            </Link>
            <Link href="/contact" className="f-btn">
              Book a demo
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

      {menu && (
        <div id="f-mega" ref={panel} className="f-mega f-mega--narrow" role="region" aria-label={menu === "platform" ? "Platform" : "Resources"}>
          <div className="f-mega__grid">
            {items.map((p) => (
              <Link key={p.href} href={p.href} className="f-mega__item">
                <IconTile name={p.icon} />
                <span className="f-h3">{p.label}</span>
                <span className="f-small">{p.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {mobile && (
        <div id="f-overlay" ref={overlay} className="f-overlay" role="dialog" aria-modal="true" aria-label="Menu">
          <p className="f-label" style={{ marginTop: 8 }}>
            Platform
          </p>
          {PLATFORM.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
          ))}
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={current(l.href)}>
              {l.label}
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
          ))}
          <p className="f-label f-overlay__group">Resources</p>
          {RESOURCES.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
              <Icon name="arrow" className="f-btn__arrow" />
            </Link>
          ))}
          <Link href="/studio">
            Studio
            <Icon name="arrow" className="f-btn__arrow" />
          </Link>
          <button type="button" className="f-btn f-btn--line" onClick={toggleTheme} style={{ marginTop: 24 }}>
            {dark ? "Light theme" : "Dark theme"}
          </button>
          <Link href="/contact" className="f-btn" style={{ marginTop: 12 }}>
            Book a demo
          </Link>
        </div>
      )}
    </>
  );
}
