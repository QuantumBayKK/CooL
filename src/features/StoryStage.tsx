"use client";

import { Chrome } from "@/components/chrome/Chrome";
import { FilmGrain } from "@/components/visual/FilmGrain";
import { CursorLight } from "@/components/visual/CursorLight";
import { OpeningSequence } from "./chapter-00-opening/OpeningSequence";
import { TheQuestion } from "./chapter-01-the-question/TheQuestion";
import { TheQuietEdit } from "./chapter-02-the-quiet-edit/TheQuietEdit";
import { TheTurn } from "./chapter-03-the-turn/TheTurn";
import { TrustDomains } from "./interludes/TrustDomains";
import { TheSealedRoom } from "./chapter-04-the-sealed-room/TheSealedRoom";
import { TheWitnesses } from "./chapter-05-the-witnesses/TheWitnesses";
import { ProofThatOutlives } from "./chapter-06-proof-that-outlives/ProofThatOutlives";
import { TheWorldRewritten } from "./chapter-07-the-world-rewritten/TheWorldRewritten";
import { TheInvitation } from "./chapter-08-the-invitation/TheInvitation";

/**
 * The full film — every chapter mounted in narrative order on one scroll timeline
 * (Technical Architecture §1). The Scene Engine pins and cleans up each chapter; the
 * Chrome surfaces recessive UI once the Cold Open is past.
 */
export function StoryStage() {
  return (
    <>
      <FilmGrain />
      <CursorLight />
      <Chrome />
      <OpeningSequence />
      <TheQuestion />
      <TheQuietEdit />
      <TheTurn />
      <TrustDomains />
      <TheSealedRoom />
      <TheWitnesses />
      <ProofThatOutlives />
      <TheWorldRewritten />
      <TheInvitation />
    </>
  );
}
