/**
 * Chapter metadata — the Story Engine's data source (Technical Architecture §4.1).
 * Maps 1:1 to the Story Bible's chapter breakdown. Adding a chapter = adding an
 * entry here + a feature module. The page renders chapters in this order.
 */

export type EmotionalBeat =
  | "curiosity"
  | "uncertainty"
  | "concern"
  | "dread"
  | "relief"
  | "discovery"
  | "confidence"
  | "inspiration"
  | "conviction";

/** Color temperature drives the per-chapter theme (CDS §3.1 chromatic timeline). */
export type Temperature = "neutral" | "warm" | "cold" | "verify" | "resolved";

export interface ChapterMeta {
  /** Stable id used for routing-by-scroll, analytics, and feature folder mapping. */
  id: string;
  /** Display index (Cold Open is 0). */
  index: number;
  title: string;
  /** The single question this chapter answers (Story Bible Rule 4). */
  question: string;
  beat: EmotionalBeat;
  temperature: Temperature;
  /** Whether the chapter needs the R3F/Three engine (lazy-loaded if true). */
  needs3D: boolean;
  /** Whether a feature module is implemented yet (false = placeholder shell). */
  implemented: boolean;
}

export const CHAPTERS: readonly ChapterMeta[] = [
  {
    id: "opening",
    index: 0,
    title: "Before Words",
    question: "What is AI already deciding?",
    beat: "curiosity",
    temperature: "warm",
    needs3D: false,
    implemented: true,
  },
  {
    id: "the-question",
    index: 1,
    title: "The Question",
    question: "How do we know the machine was right?",
    beat: "concern",
    temperature: "cold",
    needs3D: false,
    implemented: true,
  },
  {
    id: "the-quiet-edit",
    index: 2,
    title: "The Quiet Edit",
    question: "What happens to the evidence?",
    beat: "dread",
    temperature: "cold",
    needs3D: false,
    implemented: true,
  },
  {
    id: "the-turn",
    index: 3,
    title: "The Turn",
    question: "Is there another way?",
    beat: "relief",
    temperature: "verify",
    needs3D: true,
    implemented: true,
  },
  {
    id: "the-sealed-room",
    index: 4,
    title: "The Sealed Room",
    question: "Where does a decision happen untampered?",
    beat: "discovery",
    temperature: "verify",
    needs3D: true,
    implemented: true,
  },
  {
    id: "the-witnesses",
    index: 5,
    title: "The Witnesses",
    question: "How can a record never be quietly changed?",
    beat: "confidence",
    temperature: "verify",
    needs3D: true,
    implemented: true,
  },
  {
    id: "proof-that-outlives",
    index: 6,
    title: "Proof That Outlives Everything",
    question: "Will the proof still hold — and can anyone check it?",
    beat: "confidence",
    temperature: "verify",
    needs3D: true,
    implemented: true,
  },
  {
    id: "the-world-rewritten",
    index: 7,
    title: "The World, Rewritten",
    question: "What becomes possible when decisions are provable?",
    beat: "inspiration",
    temperature: "resolved",
    needs3D: false,
    implemented: true,
  },
  {
    id: "the-invitation",
    index: 8,
    title: "The Invitation",
    question: "What do you do now?",
    beat: "conviction",
    temperature: "resolved",
    needs3D: false,
    implemented: true,
  },
] as const;

export function getChapter(id: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
