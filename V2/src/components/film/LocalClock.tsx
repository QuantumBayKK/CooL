"use client";

import { useEffect, useState } from "react";

/**
 * A decorative UTC clock read from this device. It is not a server time, a
 * status signal or a timestamp of anything — and its label says so.
 */
export function LocalClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="f-label">
      Local display clock · <span className="f-mono">{now ?? "--:--:--"}</span> UTC · decorative, not a server status
    </p>
  );
}
