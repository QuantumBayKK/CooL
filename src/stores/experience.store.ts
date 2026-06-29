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
  /** Asset readiness for the tasteful entry loader. */
  assetsReady: boolean;
  /** The user has chosen to begin the film. */
  hasEntered: boolean;
  /** Audio: muted by default; opt-in (CDS §5). */
  audioEnabled: boolean;
  audioReady: boolean;
  /** Reduced-motion, synced from OS + any future user toggle. */
  reducedMotion: boolean;

  setScrollProgress: (value: number) => void;
  setActiveChapter: (id: string) => void;
  setAssetsReady: (ready: boolean) => void;
  enter: () => void;
  toggleAudio: () => void;
  setAudioReady: (ready: boolean) => void;
  setReducedMotion: (value: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  scrollProgress: 0,
  activeChapterId: "opening",
  assetsReady: false,
  hasEntered: false,
  audioEnabled: false,
  audioReady: false,
  reducedMotion: false,

  setScrollProgress: (value) => set({ scrollProgress: value }),
  setActiveChapter: (id) =>
    set((state) => (state.activeChapterId === id ? state : { activeChapterId: id })),
  setAssetsReady: (ready) => set({ assetsReady: ready }),
  enter: () => set({ hasEntered: true }),
  toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
  setAudioReady: (ready) => set({ audioReady: ready }),
  setReducedMotion: (value) => set({ reducedMotion: value }),
}));
