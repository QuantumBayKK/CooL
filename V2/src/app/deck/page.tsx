import type { Metadata } from "next";
import Backdrop from "@/components/Backdrop";
import Nav from "@/components/Nav";
import { SlideRail } from "@/components/Slide";
import DeckControls from "@/components/DeckControls";
import Cursor from "@/components/Cursor";
import IntroSequence from "@/components/IntroSequence";
import SnapScroll from "@/components/SnapScroll";
import S01Cover from "@/slides/S01Cover";
import S02Problem from "@/slides/S02Problem";
import S03Solution from "@/slides/S03Solution";
import S04Technology from "@/slides/S04Technology";
import S05Proof from "@/slides/S05Proof";
import S06Market from "@/slides/S06Market";
import S07Model from "@/slides/S07Model";
import S08Competition from "@/slides/S08Competition";
import S09GTM from "@/slides/S09GTM";
import S10Team from "@/slides/S10Team";
import S11Next from "@/slides/S11Next";

export const metadata: Metadata = {
  title: "The deck",
  description:
    "CooL's investor deck: the problem, the product, the cryptography, the market and the ask — eleven slides, one screen each.",
  alternates: { canonical: "/deck" },
  openGraph: {
    title: "CooL — the deck",
    description:
      "Eleven slides on why every AI change needs to be provable, and what it costs when it is not.",
    url: "/deck",
    type: "website",
  },
};

/**
 * The deck: eleven slides, one screen each.
 *
 * Industry validation and the use-of-funds breakdown used to sit here as slides
 * of their own. Both moved to /investors — they are diligence material rather
 * than pitch, and on the deck they interrupted the argument between "here is
 * the problem" and "here is what to do about it".
 */
export default function Page() {
  return (
    <>
      <Backdrop />
      <Nav />
      <SlideRail />
      <DeckControls />
      <SnapScroll />
      {/* one cursor, not two — the second overlay codex added was pure cost */}
      <Cursor />
      <div className="grain" aria-hidden />

      <main className="relative z-10">
        <S01Cover />
        <S02Problem />
        <S03Solution />
        <S04Technology />
        <S05Proof />
        <S06Market />
        <S07Model />
        <S08Competition />
        <S09GTM />
        <S10Team />
        <S11Next />
      </main>

      {/* last in the tree, highest layer: the cold open sits over everything
          until it has handed the cube to the cover slide */}
      <IntroSequence />
    </>
  );
}
