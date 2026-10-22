"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface Section {
  section: string;
  docs: { slug: string; title: string }[];
}

export function DocsSidebar({ sections }: { sections: Section[] }) {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);

  // On phones the index is a <details>; close it after navigating.
  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [pathname]);

  const list = (
    <nav aria-label="Documentation">
      {sections.map((s) => (
        <div key={s.section} className="f-docs__group">
          <p className="f-docs__heading">{s.section}</p>
          <ul>
            {s.docs.map((d) => {
              const href = d.slug ? `/docs/${d.slug}` : "/docs";
              const on = pathname === href;
              return (
                <li key={href}>
                  <Link href={href} aria-current={on ? "page" : undefined} className="f-docs__link">
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <aside className="f-docs__side">
      <details ref={details} className="f-docs__mobile">
        <summary>Documentation menu</summary>
        {list}
      </details>
      <div className="f-docs__desktop">{list}</div>
    </aside>
  );
}
