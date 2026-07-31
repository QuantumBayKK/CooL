"use client";

import { Canvas } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";

/**
 * Lazy WebGL stage. Mounts the canvas only when the section approaches the
 * viewport, freezes the frameloop while off-screen, caps DPR, and renders a
 * static fallback under prefers-reduced-motion. One of these per 3D moment.
 */
export default function SceneCanvas({
  children,
  className,
  fallback,
  camera,
  frozenWhenHidden = true,
}: {
  children: ReactNode;
  className?: string;
  /** shown under prefers-reduced-motion, and behind the canvas while loading */
  fallback?: ReactNode;
  camera?: { position?: [number, number, number]; fov?: number };
  frozenWhenHidden?: boolean;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) setMounted(true); // mount once, keep alive
        setInView(entry.isIntersecting);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={holder} className={clsx("relative", className)}>
      {(!mounted || reduced) && fallback}
      {mounted && !reduced && (
        <Canvas
          className="absolute inset-0"
          style={{ touchAction: "pan-y" }}
          shadows="soft"
          dpr={[1, 1.75]}
          frameloop={frozenWhenHidden && !inView ? "never" : "always"}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMappingExposure: 1.12,
          }}
          camera={{ position: camera?.position ?? [0, 0, 6], fov: camera?.fov ?? 45 }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )}
    </div>
  );
}
