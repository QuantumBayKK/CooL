"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import Stage from "./Stage";
import { makeFinish } from "./materials";
import { INTRO_DARK_MS } from "@/lib/motion";

/**
 * IntroScene — the cold open.
 *
 * DELIBERATELY LOADS NOTHING. This used to pull `product.glb` through
 * `useGLTF`, which suspends — and because the intro's Canvas has no Suspense
 * boundary of its own, a cold or slow fetch of that 0.9 MB model meant the
 * scene never mounted, `onLightsOut` never fired, and the black curtain sat
 * over the site until the failsafe timer rescued it. A loading animation that
 * can itself be blocked on a download is the one thing it must never be.
 *
 * So everything here is generated: a rounded cube and an emissive core, both
 * primitives. The sequence is frame-accurate from the first paint, on any
 * connection, every time.
 *
 * The beats: arrive → turn → open (the core rises out) → seal → the light dies.
 * It ends sealed because that is exactly how the hero's cube sits at rest, so
 * the handoff has nothing to jump. Budget is ~2.2s door to door — a cold open
 * is a held breath, not a film.
 */

const CUBE = 1.9;

const T_IN = 0.28;
const T_OPEN_START = 0.46;
const T_OPEN_END = 0.94;
const T_SEAL_END = 1.32;
/** shared with the DOM bloom layer, so both halves of the light die as one */
const T_DARK_END = T_SEAL_END + INTRO_DARK_MS / 1000;

const easeOutBack = (t: number) => {
  const c = 1.7;
  const p = t - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
};
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function IntroScene({
  /** the cube has sealed — the DOM fades its own glow layer from here */
  onSealed,
  /** the backlight is fully out — only now does the object fly into place */
  onLightsOut,
}: {
  onSealed?: () => void;
  onLightsOut?: () => void;
}) {
  const holder = useRef<THREE.Group>(null);
  const cube = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const backLight = useRef<THREE.PointLight>(null);
  const sealedFired = useRef(false);
  const darkFired = useRef(false);
  const t0 = useRef<number | null>(null);

  const cubeMat = useMemo(() => makeFinish("graphite"), []);
  const coreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bcdcff",
        emissive: "#58a6ff",
        emissiveIntensity: 2.4,
        roughness: 0.25,
        metalness: 0.1,
      }),
    [],
  );

  useFrame((state) => {
    if (t0.current == null) t0.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - t0.current;

    // arrival — the cube swells out of nothing with a little overshoot
    const cubeIn = easeOutBack(clamp01(t / T_IN));

    // the turn never stops, so the object always reads as alive
    const g = holder.current;
    if (g) {
      g.rotation.y = t * 1.15;
      g.rotation.x = Math.sin(t * 0.9) * 0.2;
      g.position.y = Math.sin(t * 1.3) * 0.06;
    }

    // `open` is how far the core is out: 0 → 1 → 0
    const opening = easeInOut(
      clamp01((t - T_OPEN_START) / (T_OPEN_END - T_OPEN_START)),
    );
    const sealing = easeInOut(
      clamp01((t - T_OPEN_END) / (T_SEAL_END - T_OPEN_END)),
    );
    const open = opening * (1 - sealing);

    if (cube.current) {
      const s = cubeIn * (1 - open * 0.86);
      cube.current.scale.setScalar(Math.max(s, 0.0001));
      cube.current.visible = s > 0.002;
    }
    if (core.current) {
      const s = open * 0.62;
      core.current.scale.setScalar(Math.max(s, 0.0001));
      core.current.visible = open > 0.004;
      core.current.rotation.y = t * 2.1;
      core.current.rotation.x = t * 1.4;
    }

    // the light behind it: flares while the cube is open, then dies completely
    const bloom = easeInOut(clamp01(t / T_OPEN_START)) * 0.7 + open * 1.05;
    const lightOut =
      1 - easeInOut(clamp01((t - T_SEAL_END) / (T_DARK_END - T_SEAL_END)));

    if (halo.current) {
      const s = 2.4 + bloom * 2.7;
      halo.current.scale.set(s, s, 1);
      (halo.current.material as THREE.MeshBasicMaterial).opacity =
        (0.1 + bloom * 0.3) * lightOut;
      halo.current.visible = lightOut > 0.002;
    }
    if (backLight.current) {
      backLight.current.intensity = (6 + bloom * 26) * lightOut;
    }
    coreMat.emissiveIntensity = 2.4 * lightOut;

    if (!sealedFired.current && t >= T_SEAL_END) {
      sealedFired.current = true;
      onSealed?.();
    }
    if (!darkFired.current && t >= T_DARK_END) {
      darkFired.current = true;
      onLightsOut?.();
    }
  });

  return (
    <>
      <Stage floor floorY={-1.7} intensity={1.15} />

      {/* the shaft of light directly behind the object */}
      <pointLight
        ref={backLight}
        position={[0, 0.2, -3.2]}
        color="#8ec3ff"
        intensity={6}
        distance={14}
      />
      <mesh ref={halo} position={[0, 0.1, -3.6]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial
          color="#bcdcff"
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={holder}>
        <RoundedBox
          ref={cube}
          args={[CUBE, CUBE, CUBE]}
          radius={0.07}
          smoothness={4}
          castShadow
          receiveShadow
          material={cubeMat}
        />
        {/* the core — an icosahedron, so it reads as machined rather than a ball */}
        <mesh ref={core} scale={0.0001} visible={false} material={coreMat}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      </group>
    </>
  );
}
