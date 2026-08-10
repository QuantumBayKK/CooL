"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CINE_EASE } from "./motion";

/**
 * The landing curtain.
 *
 * White panel, the wordmark, a hairline that fills once, then the whole thing
 * lifts and the hero drops in behind it.
 *
 * ── the constraints, and how they are met ──
 *
 * **No skip button.** Asked for explicitly, and only defensible because the
 * curtain is short and never gates anything. The page is fully rendered
 * underneath the entire time — this is a panel on top, not a loading state the
 * content waits on. It is `aria-hidden`, so a screen reader walks straight into
 * the hero, and it never mounts at all under reduced motion.
 *
 * **Fast.** 1100ms end to end. Not a preference: an interruption is forgiven
 * under about a second and resented over about two. The fill is honest about
 * being a fixed duration rather than posing as a progress meter for bytes that
 * already arrived — a fake meter that snaps to 100% is a worse lie than none.
 *
 * **Drops in.** The curtain exits upward while the hero arrives from slightly
 * above. They overlap by 260ms, so the eye follows one handoff instead of
 * watching a panel leave and then a page arrive.
 *
 * ── why it plays every time, and not once per session ──
 *
 * The obvious refinement is a `sessionStorage` flag. It was tried and removed,
 * because every way of reading it is wrong in a server-rendered page:
 *
 *   · Read it in `useState`, and the server (no storage, curtain off) disagrees
 *     with the client's first render (curtain on). That is a hydration
 *     mismatch on the landing page's root — React discards and re-renders it.
 *   · Read it in `useEffect`, and the effect runs *after* first paint, so a
 *     returning reader sees a frame of curtain before it deletes itself. A
 *     flash of something being removed reads as a bug; the full animation does
 *     not.
 *   · Read it in a blocking inline script, and the theme script that was just
 *     deleted comes back, along with its render-blocking cost on every page.
 *
 * So it plays on every load of the one page that has it. That is survivable
 * because it is 1.1 seconds, on the landing page only — every other route in
 * the site, including the docs and the console, mounts nothing.
 */

const FILL_MS = 1100;
const LIFT_MS = 620;

/** How long after mount the hero should begin arriving. */
export const DROP_DELAY_S = (FILL_MS - 260) / 1000;

export function Loader() {
  const reduced = useReducedMotion();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), FILL_MS);
    return () => clearTimeout(t);
  }, []);

  // Pure ceremony, so reduced motion removes it rather than shortening it. The
  // setting asks for no motion, not for quick motion.
  if (reduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[200] grid place-items-center bg-canvas"
          exit={{ y: "-100%" }}
          transition={{ duration: LIFT_MS / 1000, ease: CINE_EASE }}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.p
              className="font-display text-h1 tracking-[-0.02em]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: CINE_EASE }}
            >
              CooL
              <span className="text-accent">.</span>
            </motion.p>

            {/* The hairline: the same element the site uses everywhere to
                divide things, here used once to measure something. */}
            <div className="h-px w-40 overflow-hidden bg-line sm:w-56">
              <motion.div
                className="h-full w-full origin-left bg-accent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: FILL_MS / 1000, ease: CINE_EASE }}
              />
            </div>

            <motion.p
              className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-subtle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              Cryptographic evidence for AI change
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The hero's half of the handoff — arrives from slightly above as the curtain
 * leaves, overlapping it rather than queueing behind it.
 *
 * Renders its children in a plain wrapper under reduced motion, so the hero is
 * present and opaque from the first frame for anyone who asked for stillness.
 */
export function DropIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: CINE_EASE, delay: DROP_DELAY_S + delay }}
    >
      {children}
    </motion.div>
  );
}
