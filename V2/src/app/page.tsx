import type { Metadata } from "next";
import { EssayNav } from "@/components/essay/EssayNav";
import {
  Competitors,
  Cover,
  Explore,
  Founders,
  Market,
  Model,
  Problem,
  Roadmap,
  Solution,
  Technology,
} from "@/components/essay/Essay";
import { SITE } from "@/lib/site";

/**
 * The public site.
 *
 * Ten sections, one screen each, read as prose. No client boundary, no
 * scroll-triggered reveals, no 3D — the whole route is static HTML and CSS, so
 * what a crawler receives and what a phone on a slow connection receives are
 * the same thing the reader sees.
 *
 * Scroll snapping is deliberately NOT enabled here. The brief allows
 * `proximity`, and the deck uses it; this page declines even that. Snapping is
 * a nice-to-have and not-trapping is a must, and a page of prose with sections
 * that can grow when someone edits the copy is exactly where the two collide.
 * Full-height centred sections read as a deck without a snap axis at all.
 */
export const metadata: Metadata = {
  title: `${SITE.name} — The black box for AI`,
  description:
    "Every change your AI makes — documented, governed, and provable. Automatically. CooL seals every prompt, model and permission change as tamper-proof evidence anyone can verify offline.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CooL — The black box for AI",
    description:
      "Every change your AI makes — documented, governed, and provable. Automatically.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CooL — The black box for AI",
    description:
      "Every change your AI makes — documented, governed, and provable. Automatically.",
  },
};

export default function Page() {
  return (
    <div className="essay">
      <EssayNav />
      <main>
        <Cover />
        <Problem />
        <Solution />
        <Technology />
        <Model />
        <Market />
        <Competitors />
        <Founders />
        <Roadmap />
        <Explore />
      </main>
    </div>
  );
}
