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
import S06Validation from "@/slides/S06Validation";
import S07Market from "@/slides/S07Market";
import S08Model from "@/slides/S08Model";
import S09Competition from "@/slides/S09Competition";
import S10GTM from "@/slides/S10GTM";
import S11Team from "@/slides/S11Team";
import S12Funds from "@/slides/S12Funds";
import S13Ask from "@/slides/S13Ask";

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
        <S06Validation />
        <S07Market />
        <S08Model />
        <S09Competition />
        <S10GTM />
        <S11Team />
        <S12Funds />
        <S13Ask />
      </main>

      {/* last in the tree, highest layer: the cold open sits over everything
          until it has handed the cube to the cover slide */}
      <IntroSequence />
    </>
  );
}
