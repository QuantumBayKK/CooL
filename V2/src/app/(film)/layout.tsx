import { BootSequence } from "@/components/film/BootSequence";
import FilmFx from "@/components/film/FilmFx";
import { Footer } from "@/components/film/Footer";
import { Nav } from "@/components/film/Nav";
import { RouteWipe } from "@/components/film/RouteWipe";
import { filmFontVars } from "@/lib/film/fonts";

import "./film.css";

/**
 * The film-led public site: /, /verify, /evidence, /limits, /developers,
 * /pricing, /team, /design-partners, /security.
 *
 * A separate route group with its own shell and stylesheet, so the docs,
 * demo, console, studio, investor room and admin keep their own design system
 * untouched. Fonts are self-hosted by next/font at build time (WOFF2,
 * font-display: swap); only the Latin subset is shipped.
 */
export default function FilmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`film ${filmFontVars}`}>
      <Nav />
      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        {children}
      </main>
      <Footer />
      <FilmFx />
      <RouteWipe />
      <BootSequence />
    </div>
  );
}
