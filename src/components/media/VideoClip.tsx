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

  // Playback control.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || failed) return;

    if (!controlled) {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) el.play().catch(() => setFailed(true));
          else el.pause();
        },
        { threshold: 0.05 },
      );
      io.observe(el);
      return () => io.disconnect();
    }

    if (active) {
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
    return undefined;
  }, [active, controlled, failed]);

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
    return <ClipPlaceholder label={clip?.label ?? clipId} className={className} />;
  }

  const preload = !controlled ? "none" : active || warm ? "auto" : "metadata";

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
 * Tasteful fallback — a lit gradient in the void/human palette with a recessive
 * role label. Reads as intentional art direction, never as a broken asset.
 */
function ClipPlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-void", className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, var(--color-human) 22%, transparent), transparent 60%), radial-gradient(120% 120% at 80% 90%, color-mix(in oklab, var(--color-doubt) 40%, transparent), transparent 55%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void" />
      <span className="absolute bottom-6 left-6 text-caption uppercase tracking-[0.2em] text-mist">
        {label}
      </span>
    </div>
  );
}
