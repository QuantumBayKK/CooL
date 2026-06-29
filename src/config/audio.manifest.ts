/**
 * Ambient audio manifest (CDS §5). One understated loop per chapter — no continuous
 * music bed. Files are optional: until they exist under /public/audio the Audio
 * Engine no-ops gracefully. Target volumes follow the emotional arc (warm/quiet ->
 * cold/sparse -> a clear tone at the Turn -> open/resolved).
 */

export interface AmbientTrack {
  chapterId: string;
  src: string;
  /** Target volume 0..1 when this chapter is active and audio is enabled. */
  volume: number;
}

const DIR = "/audio";

export const AMBIENT: Readonly<Record<string, AmbientTrack>> = {
  opening: { chapterId: "opening", src: `${DIR}/opening.mp3`, volume: 0.5 },
  "the-question": { chapterId: "the-question", src: `${DIR}/the-question.mp3`, volume: 0.32 },
  "the-quiet-edit": { chapterId: "the-quiet-edit", src: `${DIR}/the-quiet-edit.mp3`, volume: 0.4 },
  "the-turn": { chapterId: "the-turn", src: `${DIR}/the-turn.mp3`, volume: 0.55 },
  "the-sealed-room": { chapterId: "the-sealed-room", src: `${DIR}/the-sealed-room.mp3`, volume: 0.45 },
  "the-witnesses": { chapterId: "the-witnesses", src: `${DIR}/the-witnesses.mp3`, volume: 0.45 },
  "proof-that-outlives": { chapterId: "proof-that-outlives", src: `${DIR}/proof-that-outlives.mp3`, volume: 0.45 },
  "the-world-rewritten": { chapterId: "the-world-rewritten", src: `${DIR}/the-world-rewritten.mp3`, volume: 0.5 },
  "the-invitation": { chapterId: "the-invitation", src: `${DIR}/the-invitation.mp3`, volume: 0.45 },
};

export function getAmbient(chapterId: string): AmbientTrack | undefined {
  return AMBIENT[chapterId];
}

/**
 * One-shot sound cues bound to meaningful motion moments (CDS §5). Sparse and
 * deliberate — a cue marks a transformation (sealing, verifying), never decoration.
 * Files optional under /public/audio/cues; absent cues no-op.
 */
export type CueName = "seal" | "verified" | "reject" | "tamper" | "reveal";

export interface CueDescriptor {
  src: string;
  volume: number;
}

export const CUES: Readonly<Record<CueName, CueDescriptor>> = {
  seal: { src: `${DIR}/cues/seal.mp3`, volume: 0.5 },
  verified: { src: `${DIR}/cues/verified.mp3`, volume: 0.45 },
  reject: { src: `${DIR}/cues/reject.mp3`, volume: 0.5 },
  tamper: { src: `${DIR}/cues/tamper.mp3`, volume: 0.4 },
  reveal: { src: `${DIR}/cues/reveal.mp3`, volume: 0.35 },
};
