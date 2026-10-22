import { Footer } from "@/components/film/Footer";
import { JsFlag } from "@/components/film/JsFlag";
import { Nav } from "@/components/film/Nav";
import { filmFontVars } from "@/lib/film/fonts";

import "./film.css";
import "./film-extra.css";

/**
 * Runs before first paint, inside the site root: applies the saved (or OS)
 * theme and shows the announcement bar unless it was dismissed — so neither
 * flashes or shifts the layout after hydration. Prerendered pages allow
 * inline scripts under the site CSP (see middleware.ts).
 */
const BOOT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("nw-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;var r=document.currentScript.parentElement;if(localStorage.getItem("nw-announce")!=="dismissed")r.classList.add("has-announce")}catch(e){document.currentScript.parentElement.classList.add("has-announce")}})();`;

export default function FilmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`film ${filmFontVars}`} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      <Nav />
      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>
      <Footer />
      <JsFlag />
    </div>
  );
}
