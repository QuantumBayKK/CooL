"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Container, StatusBadge } from "@/components/ui/primitives";
import { DropIn, Loader } from "./Loader";
import { useRamp } from "./motion";

/**
 * The opening.
 *
 * The curtain lifts, this arrives from slightly above, and the whole thing
 * parallaxes away as the reader starts scrolling toward Act I.
 *
 * The hero is one statement, one qualifier and two buttons — no artwork. The
 * three acts below it are several viewport-heights of artwork each, and a hero
 * that also had a diagram would be competing with them before they started.
 * The restraint here is what gives the first act somewhere to arrive from.
 *
 * The primary button goes to `/demo`, not to the `#demo` anchor further down
 * this page. The anchor technically worked and was useless: on a phone it
 * landed the reader on a section heading with the run button 968px below a
 * 844px viewport, so the call to action delivered them to nothing to press.
 *
 * The readiness badge stays. It says "Stage 0 · attestation simulated" directly
 * beneath a headline that promises sealed evidence, which looks like a mistake
 * and is not: this site's argument is that it can be checked rather than
 * believed, and a trailer that quietly dropped the caveat during the polish
 * pass would be exactly the behaviour the product exists to make detectable.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // `start start → end start`: the parallax runs only while the hero is leaving
  // the top of the screen, which is the whole window in which it is visible.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  // Callback form, not `[0, 0.75] → [1, 0]`. See `motion.ts`: Motion promotes a
  // range-form scroll opacity to a native ScrollTimeline animation, and the
  // range it infers is not the one this `useScroll` was given.
  const opacity = useRamp(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <>
      <Loader />

      <section ref={ref} className="relative">
        <motion.div style={reduced ? undefined : { y, opacity }}>
          {/* Centred, not the usual left-aligned column.
              The three acts below are all centred compositions, and a
              left-aligned hero above them left the right half of the first
              screen empty — the old layout had a code block there, and the
              trailer deliberately does not, because a hero with artwork
              competes with the artwork immediately
              below it. Centring turns that emptiness into margin. */}
          <Container>
            <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-20 text-center">
              <DropIn>
                <Link href="/security/readiness" className="group w-fit">
                  <StatusBadge
                    status="warn"
                    className="transition-colors group-hover:border-warn/50"
                  >
                    Stage 0 · working demo · attestation simulated
                  </StatusBadge>
                </Link>
              </DropIn>

              <DropIn delay={0.08}>
                <h1 className="mt-7 max-w-[18ch] text-balance text-display">
                  Every change to your AI, sealed as evidence.
                </h1>
              </DropIn>

              <DropIn delay={0.14}>
                <p className="mt-6 max-w-[56ch] text-lead text-ink-muted">
                  A prompt edit, a model swap, a permission grant. CooL commits
                  each one to a signed, tamper-evident record — then hands you a
                  verifier we do not control, so you never have to take our word
                  for any of it.
                </p>
              </DropIn>

              <DropIn delay={0.2}>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/demo">
                      Run the demo
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/docs/quickstart">Read the quickstart</Link>
                  </Button>
                </div>
              </DropIn>

              <DropIn delay={0.34}>
                <ScrollCue />
              </DropIn>
            </div>
          </Container>
        </motion.div>
      </section>
    </>
  );
}

/**
 * The scroll cue.
 *
 * A page whose first screen is a headline and two buttons gives no signal that
 * three animated acts are waiting below it, and a reader who does not scroll
 * sees none of them. This is the cheapest possible fix and the only element on
 * the page that moves without being scrolled — justified because its entire
 * job is to ask for the scroll that starts everything else.
 */
function ScrollCue() {
  const reduced = useReducedMotion();

  return (
    <div className="mt-16 flex items-center justify-center gap-2.5 text-ink-subtle">
      <motion.span
        aria-hidden
        animate={reduced ? undefined : { y: [0, 5, 0] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="size-4" strokeWidth={1.75} />
      </motion.span>
      <span className="text-label uppercase">Scroll — install to evidence</span>
    </div>
  );
}
