"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF, RoundedBox } from "@react-three/drei";
import Stage from "./Stage";
import { applyFinish, makeFinish } from "./materials";
import { INTRO_DARK_MS } from "@/lib/motion";

const MODEL = "/models/product.glb";
const DRACO = "/draco/";

const CUBE = 1.9;
const MODEL_SIZE = 2.6;

/* ---- the beats, in seconds ----
   arrive → turn → open (the core comes out) → seal again → the light dies.
   Three things are deliberate:
     · it ends sealed, because the hero's own cube sits at rest in exactly that
       state, so the handoff has nothing to jump;
     · the backlight is fully out before the object moves. The light is what
       makes the cold open dramatic, and letting it fade first means the flight
       to the cover reads as a quiet settling rather than a second flourish;
     · the whole sequence is budgeted at ~2.5s door to door. A cold open is a
       held breath, not a film — past about three seconds it stops being
       atmosphere and starts being a toll gate on the way to the deck. Every
       beat below is therefore the shortest version that still reads. */
const T_IN = 0.3;
const T_OPEN_START = 0.5;
const T_OPEN_END = 1.0;
const T_SEAL_END = 1.4;
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

/**
 * IntroScene — the cold open.
 *
 * A sealed graphite cube turns slowly in a shaft of blue backlight, opens so
 * the animated core can emerge, then closes around it again. One self-contained
 * clock drives all of it, so the beats never drift from React's render cycle.
 */
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
  const core = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const backLight = useRef<THREE.PointLight>(null);
  const sealedFired = useRef(false);
  const darkFired = useRef(false);
  const t0 = useRef<number | null>(null);

  const cubeMat = useMemo(() => makeFinish("graphite"), []);
  const { scene, animations } = useGLTF(MODEL, DRACO);
  const { actions } = useAnimations(animations, core);

  useEffect(() => {
    applyFinish(scene, "graphite");
    for (const a of Object.values(actions)) {
      if (!a) continue;
      a.reset();
      a.setLoop(THREE.LoopRepeat, Infinity);
      a.timeScale = 0.7;
      a.play();
    }
  }, [scene, actions]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z) || 1;
    return MODEL_SIZE / max;
  }, [scene]);

  useFrame((state) => {
    if (t0.current == null) t0.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - t0.current;

    // arrival — the cube swells out of nothing with a little overshoot
    const cubeIn = easeOutBack(clamp01(t / T_IN));

    // the turn never stops, so the object always reads as alive. Faster than it
    // was, because there is now only ~1.4s in which to read as turning at all.
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
    const sealing = easeInOut(clamp01((t - T_OPEN_END) / (T_SEAL_END - T_OPEN_END)));
    const open = opening * (1 - sealing);

    if (cube.current) {
      const s = cubeIn * (1 - open);
      cube.current.scale.setScalar(Math.max(s, 0.0001));
      cube.current.visible = s > 0.002;
    }
    if (core.current) {
      const s = fit * open;
      core.current.scale.setScalar(Math.max(s, 0.0001));
      core.current.visible = open > 0.004;
    }

    // the light behind it: a bloom that flares while the cube is open, then
    // dies away completely once the cube is sealed again. The ramp has to
    // finish inside the open beat, so it tracks T_OPEN_START rather than a
    // fixed 1.8s that would now still be rising as the cube re-seals.
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
        <group ref={core} scale={0.0001} visible={false}>
          <primitive object={scene} />
        </group>
      </group>
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
