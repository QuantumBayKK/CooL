/**
 * Clip manifest — single source of truth mapping logical clip ids -> files + role.
 *
 * Logical ids stay stable (`<story>-<NN>-<role>`); the on-disk layout is the
 * category/clipN structure actually uploaded under /public/clips:
 *
 *   public/clips/<folder>/clip<N>.mp4
 *   folder : hospital | fintech | education | law | employment
 *   N      : 1=establishing  2=human  3=ai  4=emotion
 *
 * opening.data.ts references clip IDs, never raw paths. The VideoClip component
 * resolves an id -> src here and degrades gracefully if the file is absent.
 */

export type ClipRole = "establishing" | "human" | "ai" | "emotion" | "transition";

export interface ClipDescriptor {
  id: string;
  /** Path under /public. */
  src: string;
  role: ClipRole;
  /** Human-readable label used by the graceful placeholder when a file is absent. */
  label: string;
}

const CLIP_DIR = "/clips";
const STORIES = ["healthcare", "finance", "education", "law", "employment"] as const;
type Story = (typeof STORIES)[number];

/** Narrative story key -> the uploaded category folder name. */
const STORY_FOLDER: Record<Story, string> = {
  healthcare: "hospital",
  finance: "fintech",
  education: "education",
  law: "law",
  employment: "employment",
};

/** Role order maps to clip1..clip4 within each category folder. */
const ROLES: readonly Exclude<ClipRole, "transition">[] = [
  "establishing",
  "human",
  "ai",
  "emotion",
];

const ROLE_LABEL: Record<ClipRole, string> = {
  establishing: "Establishing",
  human: "Human",
  ai: "AI",
  emotion: "Emotion",
  transition: "Transition",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildManifest(): Record<string, ClipDescriptor> {
  const manifest: Record<string, ClipDescriptor> = {};

  for (const story of STORIES) {
    const folder = STORY_FOLDER[story];
    ROLES.forEach((role, i) => {
      const id = `${story}-${pad2(i + 1)}-${role}`;
      manifest[id] = {
        id,
        src: `${CLIP_DIR}/${folder}/clip${i + 1}.mp4`,
        role,
        label: `${story} · ${ROLE_LABEL[role]}`,
      };
    });
  }

  // Transitions are optional; absent files fall back gracefully.
  for (let i = 1; i <= 10; i++) {
    const id = `transition-${pad2(i)}`;
    manifest[id] = {
      id,
      src: `${CLIP_DIR}/transition-${pad2(i)}.mp4`,
      role: "transition",
      label: `Transition ${pad2(i)}`,
    };
  }

  return manifest;
}

export const CLIPS: Readonly<Record<string, ClipDescriptor>> = buildManifest();

export function getClip(id: string): ClipDescriptor | undefined {
  return CLIPS[id];
}
