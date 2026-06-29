"use client";

import { useExperienceStore } from "@/stores/experience.store";
import { cn } from "@/lib/cn";

/**
 * Sound opt-in (CDS §6). Muted by default; the click is the user gesture that
 * unlocks audio. Recessive, premium, keyboard-operable.
 */
export function SoundToggle() {
  const audioEnabled = useExperienceStore((s) => s.audioEnabled);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);

  return (
    <button
      type="button"
      onClick={toggleAudio}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? "Mute ambient sound" : "Enable ambient sound"}
      className="group pointer-events-auto flex items-center gap-3 text-mist transition-colors hover:text-paper focus-visible:text-paper focus-visible:outline-none"
    >
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {[0.45, 0.85, 0.6, 1].map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[2px] origin-bottom rounded-full bg-current transition-transform duration-500",
              audioEnabled ? "animate-none" : "scale-y-50",
            )}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </span>
      <span className="text-caption uppercase tracking-[0.25em]">
        {audioEnabled ? "Sound on" : "Sound"}
      </span>
    </button>
  );
}
