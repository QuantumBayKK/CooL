"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type Vec3 = [number, number, number];

/* ---- device-tilt parallax (phones): gamma/beta relative to how the
   phone is being held; first reading becomes the neutral baseline.
   iOS withholds events until permission — then this simply stays 0. ---- */
const gyro = { x: 0, y: 0, baseBeta: null as number | null, wired: false };

function wireGyro(): void {
  if (gyro.wired || typeof window === "undefined") return;
  gyro.wired = true;
  window.addEventListener(
    "deviceorientation",
    (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      if (gyro.baseBeta === null) gyro.baseBeta = e.beta;
      gyro.x = Math.max(-1, Math.min(1, e.gamma / 28));
      gyro.y = Math.max(-1, Math.min(1, (e.beta - gyro.baseBeta) / 28));
    },
    { passive: true },
  );
}

/**
 * Vision-Pro-style camera travel: as the section scrolls through the
 * viewport, the camera glides from `from` to `to` (GSAP ScrollTrigger scrub),
 * with heavy inertia so it never jumps. The object barely moves — the
 * camera does the storytelling. On phones, device tilt replaces the
 * cursor for the parallax drift.
 */
export function useScrollCamera(
  sectionId: string,
  {
    from,
    to,
    lookAt = [0, 0, 0],
    drift = 0.12,
  }: { from: Vec3; to: Vec3; lookAt?: Vec3; drift?: number },
): void {
  const progress = useRef(0);

  useEffect(() => {
    wireGyro();
    const trigger = document.getElementById(sectionId);
    if (!trigger) return;
    const st = ScrollTrigger.create({
      trigger,
      start: "top bottom",
      end: "bottom top",
      scrub: 0.9,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    return () => st.kill();
  }, [sectionId]);

  const vFrom = useMemo(() => new THREE.Vector3(...from), [from]);
  const vTo = useMemo(() => new THREE.Vector3(...to), [to]);
  const vLook = useMemo(() => new THREE.Vector3(...lookAt), [lookAt]);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    target.lerpVectors(vFrom, vTo, progress.current);
    // gentle parallax: cursor on desktop, device tilt on phones
    target.x += (state.pointer.x + gyro.x) * drift;
    target.y += (state.pointer.y - gyro.y) * drift * 0.6;
    const k = 1 - Math.pow(0.001, delta); // heavy inertia, frame-rate independent
    state.camera.position.lerp(target, k * 0.6);
    state.camera.lookAt(vLook);
  });
}
