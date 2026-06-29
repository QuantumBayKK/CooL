/**
 * Opening Sequence content — data-driven (Opening Sequence Master Prompt).
 * Copy is the "dialogue spoken by the film itself." Clip ids resolve via the
 * manifest; the experience runs with graceful placeholders until footage lands.
 */

export interface StoryBeat {
  /** Story key, matches the clip-manifest story prefix. */
  key: "healthcare" | "finance" | "education" | "law" | "employment";
  /** Establishing, human, ai, emotion — in order. */
  clips: readonly [string, string, string, string];
  /** Short interstitial lines that appear between scenes. */
  lines: readonly string[];
  /** The closing statement (1–2 lines) that fills the screen. */
  question: readonly string[];
}

function storyClips(key: StoryBeat["key"]): StoryBeat["clips"] {
  return [
    `${key}-01-establishing`,
    `${key}-02-human`,
    `${key}-03-ai`,
    `${key}-04-emotion`,
  ];
}

export const COLD_OPEN_LINES: readonly string[] = [
  "Every day…",
  "Artificial Intelligence makes decisions…",
  "…that change human lives.",
];

export const STORIES: readonly StoryBeat[] = [
  {
    key: "healthcare",
    clips: storyClips("healthcare"),
    lines: ["A diagnosis.", "A recommendation.", "A life."],
    question: ["When an AI helps save a life…", "Who proves what it actually decided?"],
  },
  {
    key: "finance",
    clips: storyClips("finance"),
    lines: ["A business.", "A loan.", "A future."],
    question: ["When AI decides who gets funding…", "Who proves why?"],
  },
  {
    key: "education",
    clips: storyClips("education"),
    lines: ["A student.", "A recommendation.", "A career."],
    question: ["When AI shapes someone's future…", "Who verifies that decision?"],
  },
  {
    key: "law",
    clips: storyClips("law"),
    lines: ["Justice begins with evidence.", "But what if the evidence comes from AI?"],
    question: ["Can that evidence ever be proven?"],
  },
  {
    key: "employment",
    clips: storyClips("employment"),
    lines: ["A résumé.", "An interview.", "A career."],
    question: ["When AI decides who gets hired…", "Who proves its decision?"],
  },
];

export const REALIZATION_LINES: readonly string[] = [
  "We trusted AI…",
  "We never learned to trust its decisions.",
  "Because we could never prove them.",
];

export const BRAND = {
  name: "CooL",
  subtitle: "The Trust Layer for Artificial Intelligence",
  tagline: "The black box for AI.",
  entity: "NorthWind Cipher Pvt Ltd",
} as const;
