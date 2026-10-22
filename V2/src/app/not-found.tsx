import type { Metadata } from "next";
import Link from "next/link";

import { filmFontVars } from "@/lib/film/fonts";

import "./(film)/film.css";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That URL does not resolve. Return to base, or go straight to the verifier.",
  robots: { index: false, follow: true },
};

/**
 * 404 — an inverted scene: white field, black type, one way back.
 *
 * Lives at the app root because a `not-found.tsx` inside a route group only
 * catches misses within that group; a URL matching nothing falls through to
 * here. It therefore brings its own stylesheet and fonts. `index: false,
 * follow: true` keeps it out of the index while its links stay crawlable.
 */
export default function NotFound() {
  return (
    <div className={`film ${filmFontVars}`}>
      <main id="main" className="f-invert f-404">
        <div>
          <p className="f-label">[ Error 404 · no record at this address ]</p>
          <h1 className="f-display" style={{ marginTop: 24 }}>
            Signal lost.
          </h1>
          <p className="f-lead" style={{ margin: "28px auto 0" }}>
            Nothing was recorded at this URL. That is the one thing we can say with certainty.
          </p>
          <div className="f-btn-row" style={{ justifyContent: "center", marginTop: 40 }}>
            <Link href="/" className="f-btn">
              Return to base
            </Link>
            <Link href="/verify" className="f-btn f-btn--line">
              Run the verifier
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
