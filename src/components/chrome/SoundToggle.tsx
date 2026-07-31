"use client";

import { scrollSound } from "@/engines/audio/ScrollSound";
import { useExperienceStore } from "@/stores/experience.store";
import { cn } from "@/lib/cn";

/**
 * The one always-available control (CDS §6 + WCAG 1.4.2 audio control): sound is
 * auto-enabled on the first gesture, so the viewer must be able to silence it.
 * Recessive — a small glyph in the corner that adopts the verify accent when live.
 */
export function SoundToggle() {
  const audioEnabled = useExperienceStore((s) => s.audioEnabled);
  const toggleAudio = useExperienceStore((s) => s.toggleAudio);

  const onToggle = () => {
    // Unlock inside the gesture so unmuting works even as the very first interaction.
    scrollSound.unlock();
    toggleAudio();
  };

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={onToggle}
      aria-label={audioEnabled ? "Mute sound" : "Enable sound"}
      aria-pressed={audioEnabled}
      title={audioEnabled ? "Mute sound" : "Enable sound"}
      className={cn(
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-500",
        "border-white/10 bg-void-raised/60 backdrop-blur-sm",
        "hover:border-verify/40 focus-visible:border-verify/60 focus-visible:outline-none",
        audioEnabled ? "text-verify" : "text-mist",
      )}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* Speaker body */}
        <path
          d="M4 9.5v5h3.2L12 18.6V5.4L7.2 9.5H4z"
          fill="currentColor"
          opacity={0.9}
        />
        {audioEnabled ? (
          <>
            {/* Sound waves */}
            <path
              d="M15 9.2a4.2 4.2 0 010 5.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M17.6 7a7.4 7.4 0 010 10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity={0.55}
            />
          </>
        ) : (
          /* Mute cross */
          <path
            d="M15.5 9.7l4.6 4.6m0-4.6l-4.6 4.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
