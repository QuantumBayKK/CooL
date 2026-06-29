"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useExperienceStore } from "@/stores/experience.store";
import { SoundToggle } from "./SoundToggle";
import { ChapterProgress } from "./ChapterProgress";

/**
 * The almost-invisible UI (CDS §6). Nothing during the Cold Open; once the film is
 * underway, a recessive progress column and the sound toggle fade in.
 */
export function Chrome() {
  const activeChapterId = useExperienceStore((s) => s.activeChapterId);
  const visible = activeChapterId !== "opening";

  return (
    <AnimatePresence>
      {visible && (
        <>
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

          <motion.div
            key="sound"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed bottom-6 left-6 z-40"
          >
            <SoundToggle />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
