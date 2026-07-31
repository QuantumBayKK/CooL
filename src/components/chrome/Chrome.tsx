"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/stores/experience.store";
import { ChapterProgress } from "./ChapterProgress";
import { SoundToggle } from "./SoundToggle";

/**
 * The almost-invisible UI (CDS §6). Nothing during the Cold Open; once the film is
 * underway, a recessive progress column fades in. The sound toggle is always
 * available (audio auto-enables on the first gesture, so muting must never require
 * scrolling somewhere first).
 */
export function Chrome() {
  const activeChapterId = useExperienceStore((s) => s.activeChapterId);
  const visible = activeChapterId !== "opening";

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-5 z-40 md:bottom-6 md:right-6">
        <SoundToggle />
      </div>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 md:block"
          >
            <ChapterProgress />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
