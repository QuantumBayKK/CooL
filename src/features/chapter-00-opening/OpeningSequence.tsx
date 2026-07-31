"use client";

import { ColdOpen } from "./ColdOpen";
import { DocumentaryStory } from "./DocumentaryStory";
import { Realization } from "./Realization";
import { STORIES } from "./opening.data";

/**
 * Chapter 0 orchestrator (Opening Sequence Master Prompt). Assembles the film's
 * first chapter: Cold Open -> five documentary stories -> a beat of silence ->
 * the Realization and the birth of the CooL identity. Each child is an isolated,
 * deterministic scene module.
 */
export function OpeningSequence() {
  return (
    <div className="relative w-full">
      <ColdOpen />

      {STORIES.map((story) => (
        <DocumentaryStory key={story.key} story={story} />
      ))}

      {/* Silence — a held beat before the realization (not a void). */}
      <section aria-hidden className="h-[55vh] w-full bg-transparent" />

      <Realization />
    </div>
  );
}
