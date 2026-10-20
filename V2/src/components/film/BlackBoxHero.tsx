"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { HERO } from "@/content/copy";
import { MOTION } from "@/lib/film/motion";
import { readMotionProfile } from "@/lib/film/reducedMotion";

import { CopyCommand } from "./CopyCommand";
import { HERO_SEQ, frameUrl, loadSequence } from "./frames";

/**
 * The opening statement.
 *
 * The film is a 1-bit dithered frame loop drawn to a canvas: crisper than a
 * compressed video (no grey compression mush in a black/white palette) and
 * ~500 KB for ten seconds. The first frame ships as a plain <img> so the hero
 * is never empty before JS; the other frames load only after the window load
 * event, in idle time; playback pauses off-screen, in a background tab, under reduced
 * motion, and on the visible pause control.
 *
 * Footage: Pexels License, see public/film/CREDITS.md. It is illustrative
 * hardware, not a CooL device.
 */
export function BlackBoxHero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const want = useRef(true);

  useEffect(() => {
    const profile = readMotionProfile();
    if (profile.reduced) {
      want.current = false;
      return;
    }
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let loaded = 0;
    let frames: (HTMLImageElement | null)[] = [];
    let cancel = () => {};
    let disposed = false;
    let ready = false;
    // Nothing film-related touches the main thread until the page has loaded
    // and gone idle: the headline is the LCP element, and decoding 120 frames
    // during load only delays its paint.
    const begin = () => {
      if (disposed) return;
      const seq = loadSequence(
      HERO_SEQ,
      () => {
        loaded++;
        if (loaded > 24) setCanPlay(true);
      },
      profile.lowPower ? 2 : 1,
      );
      frames = seq.frames;
      cancel = seq.cancel;
      ready = true;
      setTimeout(start, 600);
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const afterLoad = () => (ric ? ric(begin, { timeout: 2500 }) : setTimeout(begin, 1200));
    if (document.readyState === "complete") afterLoad();
    else addEventListener("load", afterLoad, { once: true });

    let raf = 0;
    let last = 0;
    let i = 0;
    let visible = true;
    const step = profile.lowPower ? 2 : 1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < (1000 / MOTION.heroFps) * step) return;
      last = now;
      const img = frames[i];
      if (img) ctx.drawImage(img, 0, 0);
      i = (i + step) % HERO_SEQ.count;
    };
    const start = () => {
      if (!raf && ready && want.current && visible && !document.hidden) {
        raf = requestAnimationFrame(tick);
        setPlaying(true);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      setPlaying(false);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    io.observe(cv);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ctl = (e: Event) => {
      want.current = (e as CustomEvent<boolean>).detail;
      if (want.current) start();
      else stop();
    };
    cv.addEventListener("film:play", ctl);
    return () => {
      disposed = true;
      removeEventListener("load", afterLoad);
      cancel();
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("film:play", ctl);
    };
  }, []);

  const toggle = () => {
    canvas.current?.dispatchEvent(new CustomEvent("film:play", { detail: !playing }));
  };

  return (
    <section className="f-hero" aria-labelledby="hero-title">
      <div className="f-hero__film" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- 1-bit PNG, must not be resampled */}
        <img src={frameUrl(HERO_SEQ, 0)} alt="" width={640} height={360} fetchPriority="high" />
        <canvas
          ref={canvas}
          width={HERO_SEQ.width}
          height={HERO_SEQ.height}
          style={{ position: "absolute", inset: 0 }}
        />
      </div>
      <div className="f-hero__shade" aria-hidden="true" />
      <div className="f-hero__scan" aria-hidden="true" />

      {canPlay && (
        <button type="button" className="f-btn f-btn--line f-hero__pause" onClick={toggle} aria-pressed={!playing}>
          {playing ? "❚❚ Pause film" : "▶ Play film"}
        </button>
      )}

      <div className="f-wrap f-hero__body">
        <p className="f-label">{HERO.kicker}</p>
        <h1 id="hero-title" className="f-display" style={{ marginTop: 20 }}>
          {HERO.line1}
          <span className="f-hero__second">{HERO.line2}</span>
        </h1>
        <div className="f-grid" style={{ marginTop: 32, alignItems: "end" }}>
          <p className="f-lead f-span-6">{HERO.support}</p>
          <div className="f-span-6 f-btn-row" style={{ justifyContent: "flex-end" }}>
            <Link href="/verify" className="f-btn" data-impact="max">
              Run the verifier
              <svg className="f-btn__arrow" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M1 7h12M8 2l5 5-5 5" />
              </svg>
            </Link>
            <CopyCommand command={HERO.install} />
          </div>
        </div>
        <div className="f-hero__meta">
          <span className="f-label">[ ML-DSA-65 + Ed25519 ]</span>
          <span className="f-label">[ RFC 6962 log ]</span>
          <span className="f-label">[ Verified on Intel TDX · Phala Cloud ]</span>
          <span className="f-label">[ Footage: illustrative ]</span>
        </div>
      </div>
    </section>
  );
}
