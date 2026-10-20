"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Black wipe on client-side route changes. Skipped on the first load (the
 * boot sequence owns that moment, and an opaque layer over first paint would
 * only delay what the visitor came for) and under reduced motion (CSS).
 */
export function RouteWipe() {
  const pathname = usePathname();
  const first = useRef(true);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey(pathname);
    const t = setTimeout(() => setKey(null), 620);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!key) return null;
  return (
    <div key={key} className="f-wipe" aria-hidden="true">
      <span className="f-label">[ loading {key} ]</span>
    </div>
  );
}
