"use client";

import { CHAPTERS } from "@/config/chapters.config";
import { useExperienceStore } from "@/stores/experience.store";
import { cn } from "@/lib/cn";

/**
 * Progress felt, not bolted on (CDS §6). A recessive column of ticks marking the
 * chapters; the active one extends and adopts the "verify" accent. Display-only.
 */
export function ChapterProgress() {
  const activeChapterId = useExperienceStore((s) => s.activeChapterId);
  const activeIndex = CHAPTERS.findIndex((c) => c.id === activeChapterId);

  return (
    <nav aria-label="Chapter progress" className="pointer-events-none flex flex-col items-end gap-3">
      {CHAPTERS.map((chapter, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <span key={chapter.id} className="flex items-center gap-3">
            <span
              className={cn(
                "text-caption uppercase tracking-[0.2em] transition-all duration-500",
                isActive ? "text-paper opacity-100" : "text-mist opacity-0",
              )}
            >
              {chapter.title}
            </span>
            <span
              className={cn(
                "h-px rounded-full transition-all duration-500",
                isActive ? "w-8 bg-verify" : isPast ? "w-4 bg-mist" : "w-4 bg-mist/30",
              )}
            />
          </span>
        );
      })}
    </nav>
  );
}
