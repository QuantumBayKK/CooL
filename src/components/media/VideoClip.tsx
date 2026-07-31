"use client";

import { useEffect, useRef, useState } from "react";
import { getClip } from "@/config/clips.manifest";
import { cn } from "@/lib/cn";

export interface VideoClipProps {
  /** Logical clip id resolved via the manifest (never a raw path). */
  clipId: string;
  className?: string;
  /** CSS object-position for cinematic framing. */
  objectPosition?: string;
  /**
   * Controlled playback. When provided, the clip plays only while `true` — used by
   * crossfade stacks so just one video decodes at a time (avoids the jank of four
   * full-screen videos playing at once). Omit for a lone intersection-driven clip.
   */
  active?: boolean;
  /** Warm the buffer ahead of activation (e.g. the next clip in a stack). */
  warm?: boolean;
}

/**
 * Lazy video (Technical Architecture §7). Controlled or intersection-driven playback,
 * muted + looped + inline, with a graceful lit placeholder when a file is absent.
 */
export function VideoClip({ clipId, className, objectPosition, active, warm }: VideoClipProps) {
  const clip = getClip(clipId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const controlled = active !== undefined;

  const [visible, setVisible] = useState(false);

  // Track real on-screen visibility so off-screen stories never decode (every
  // stacked clip shares inset-0, so only the genuinely scrolled-to story plays).
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!!entry?.isIntersecting),
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play only while visible AND (controlled ? active|warm : true). A play() promise
  // rejects with AbortError whenever a pause() lands before it settles (normal during
  // fast crossfades) — that is NOT a failure, so we swallow it. Genuine load failures
  // surface through the <video> onError handler instead. (This false-fail was what
  // blanked the healthcare clips into the placeholder.)
  useEffect(() => {
    const el = videoRef.current;
    if (!el || failed) return;
    const shouldPlay = visible && (controlled ? active || warm : true);
    if (shouldPlay) {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      el.pause();
    }
  }, [visible, active, warm, controlled, failed]);

  // Release memory on unmount.
  useEffect(() => {
    const el = videoRef.current;
    return () => {
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
    };
  }, []);

  if (!clip || failed) {
    return <ClipPlaceholder className={className} />;
  }

  // Keep a real first frame ready for every clip (metadata) and fully buffer the
  // ones in/near play, so nothing reads as a missing/black clip.
  const preload = active || warm ? "auto" : "metadata";

  return (
    <video
      ref={videoRef}
      className={cn("h-full w-full object-cover", className)}
      style={{ objectPosition, willChange: "opacity" }}
      src={clip.src}
      muted
      loop
      playsInline
      preload={preload}
      aria-hidden
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Tasteful fallback when a clip is genuinely absent — a quiet, unlabelled dark
 * field with a faint depth wash. No role text (that read as a debug/AI artifact);
 * it should simply look like part of the film.
 */
function ClipPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-void", className)} aria-hidden>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 40%, color-mix(in oklab, var(--color-doubt) 22%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
