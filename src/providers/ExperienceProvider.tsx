"use client";

import { type ReactNode, useEffect } from "react";
import { SmoothScrollProvider } from "./SmoothScrollProvider";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Boots the global experience lifecycle and composes app-wide providers
 * (Technical Architecture §5). Owns the Audio Engine instance and reacts to the
 * store: chapter changes crossfade ambience; the sound toggle enables/mutes it.
 */
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const setAssetsReady = useExperienceStore((s) => s.setAssetsReady);
  const audioEnabled = useExperienceStore((s) => s.audioEnabled);
  const activeChapterId = useExperienceStore((s) => s.activeChapterId);

  useEffect(() => {
    // Placeholder until the Asset Manager preload pipeline lands.
    setAssetsReady(true);
    return () => audioEngine.dispose();
  }, [setAssetsReady]);

  useEffect(() => {
    audioEngine.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    audioEngine.play(activeChapterId);
  }, [activeChapterId]);

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
