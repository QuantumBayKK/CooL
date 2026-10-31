"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NcMark } from "./NcLogo";

const LINKS: [string, string][] = [
  ["/community", "Home"],
  ["/community/world", "World"],
  ["/community/projects", "Projects"],
  ["/community/contributors", "People"],
  ["/community/guidelines", "Guidelines"],
];

export function CommunityNav({ signedIn, owner, unread = 0 }: { signedIn: boolean; owner: boolean; moderator?: boolean; unread?: number }) {
  const path = usePathname();
  const current = (href: string) => (href === "/community" ? path === href : path === href || path.startsWith(href + "/"));
  const end: [string, string][] = [
    ...(owner ? ([["/community/admin", "Admin"]] as [string, string][]) : []),
    ...(signedIn ? ([["/community/inbox", "Inbox"]] as [string, string][]) : []),
    signedIn ? ["/community/profile", "Profile"] : ["/community/login", "Sign in"],
  ];
  return (
    <nav className="cm-nav" aria-label="Community">
      <span className="cm-nav-mark" aria-hidden><NcMark size={18} /></span>
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={current(href) ? "page" : undefined}>
          {label}
        </Link>
      ))}
      {end.map(([href, label], i) => (
        <Link key={href} href={href} className={i === 0 ? "cm-nav-end" : undefined} aria-current={current(href) ? "page" : undefined}>
          {label}{href === "/community/inbox" && unread > 0 && <span className="cm-nav-count" aria-label={`${unread} unread`}>{unread}</span>}
        </Link>
      ))}
    </nav>
  );
}
