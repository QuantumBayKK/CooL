"use client";

import { type ReactNode, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { SmoothScrollProvider } from "./SmoothScrollProvider";
import { audioEngine } from "@/engines/audio/AudioEngine";
import { scrollSound } from "@/engines/audio/ScrollSound";
import { useExperienceStore } from "@/stores/experience.store";

/**
 * Boots the global experience lifecycle and composes app-wide providers
 * (Technical Architecture §5). Owns the Audio Engine instance and reacts to the
 * store: chapter changes crossfade ambience; the sound toggle enables/mutes it.
 */
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const audioEnabled = useExperienceStore((s) => s.audioEnabled);
  const activeChapterId = useExperienceStore((s) => s.activeChapterId);

  useEffect(() => {
    return () => {
      audioEngine.dispose();
      scrollSound.dispose();
    };
  }, []);

  // Unlock + enable audio on the first user interaction (the SoundToggle in the
  // Chrome lets people mute it again at any time). Audio autoplay requires a
  // gesture; wheel/pointer/key all count as user activation. Gestures on the sound
  // toggle itself are ignored so its explicit choice always wins.
  useEffect(() => {
    const remove = () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("wheel", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    const onFirst = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-sound-toggle]")) return;
      remove();
      scrollSound.unlock();
      if (!useExperienceStore.getState().audioEnabled) {
        useExperienceStore.setState({ audioEnabled: true });
      }
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", onFirst, opts);
    window.addEventListener("wheel", onFirst, opts);
    window.addEventListener("keydown", onFirst, opts);
    return remove;
  }, []);

  // The store's audioEnabled flag is the single source of truth for every sound
  // source — the ambience engine and the synthesized scroll texture both follow it.
  useEffect(() => {
    audioEngine.setEnabled(audioEnabled);
    scrollSound.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    audioEngine.play(activeChapterId);
  }, [activeChapterId]);

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </MotionConfig>
  );
}
