"use client";

import { create } from "zustand";

/**
 * The ONE global store (Technical Architecture §5). Holds only truly cross-cutting
 * state. Everything else stays local. Components subscribe to slices.
 */
export interface ExperienceState {
  /** Whole-experience scroll progress, 0..1. */
  scrollProgress: number;
  /** Currently active chapter id (derived from scroll). */
  activeChapterId: string;
  /** Audio: off until the first gesture; the SoundToggle mutes/unmutes (CDS §5). */
  audioEnabled: boolean;
  /** Reduced-motion, synced from OS + any future user toggle. */
  reducedMotion: boolean;

  setScrollProgress: (value: number) => void;
  setActiveChapter: (id: string) => void;
  toggleAudio: () => void;
  setReducedMotion: (value: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  scrollProgress: 0,
  activeChapterId: "opening",
  audioEnabled: false,
  reducedMotion: false,

  setScrollProgress: (value) => set({ scrollProgress: value }),
  setActiveChapter: (id) =>
    set((state) => (state.activeChapterId === id ? state : { activeChapterId: id })),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));
