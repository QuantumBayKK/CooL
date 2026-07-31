"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  PresentationControls,
  RoundedBox,
} from "@react-three/drei";
import Stage from "./Stage";
import { applyFinish, makeFinish } from "./materials";
import { useScrollCamera } from "./useScrollCamera";

const MODEL = "/models/product.glb";
const DRACO = "/draco/";

const CUBE_SIZE = 1.9;
const MODEL_SIZE = 2.5;

/** frame-rate independent lerp factor */
const dampK = (dt: number) => 1 - Math.exp(-8 * dt);

/* The sealed black box at rest. Scales away when the morph takes over. */
function BlackCube({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const material = useMemo(() => makeFinish("graphite"), []);

  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const target = active ? 0.0001 : 1;
    const s = THREE.MathUtils.lerp(m.scale.x, target, dampK(dt));
    m.scale.setScalar(s);
  });

  return (
    <RoundedBox
      ref={ref}
      args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]}
      radius={0.07}
      smoothness={4}
      castShadow
      receiveShadow
      material={material}
      rotation={[0.28, -0.55, 0]}
    />
  );
}

/* The morph — hidden inside the cube, revealed and animated on interaction. */
function MorphCore({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL, DRACO);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    applyFinish(scene, "graphite");
    for (const action of Object.values(actions)) {
      if (!action) continue;
      action.reset();
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.timeScale = 0.6;
      action.play();
      action.paused = true;
    }
  }, [scene, actions]);

  // the morph only computes while it's on stage
  useEffect(() => {
    for (const action of Object.values(actions)) {
      if (action) action.paused = !active;
    }
  }, [actions, active]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return MODEL_SIZE / maxDim;
  }, [scene]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const target = active ? fit : 0.0001;
    const s = THREE.MathUtils.lerp(g.scale.x, target, dampK(dt));
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} scale={0.0001}>
      <primitive object={scene} />
    </group>
  );
}

export default function HeroScene({
  variant = "hero",
  sectionId = "cover",
}: {
  variant?: "hero" | "vision";
  sectionId?: string;
}) {
  const isHero = variant === "hero";
  const [active, setActive] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holder = useRef<THREE.Group>(null);

  const wake = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setActive(true);
  }, []);
  const rest = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    // linger a moment, then seal back into the cube
    idleTimer.current = setTimeout(() => setActive(false), 1400);
  }, []);
  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  useScrollCamera(sectionId, {
    from: isHero ? [0, 0.3, 6.8] : [0, 0.1, 5.6],
    to: isHero ? [0.4, -0.15, 5.9] : [0, 1.4, 11.5], // vision: the standard recedes
    lookAt: [0, 0, 0],
    drift: isHero ? 0.12 : 0.05,
  });

  // idle breathing — alive, never rotating
  useFrame((state) => {
    const g = holder.current;
    if (!g) return;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.05;
  });

  if (!isHero) {
    // vision: the sealed box, receding into infrastructure
    return (
      <>
        <Stage floor floorY={-1.5} intensity={0.85} />
        <group ref={holder}>
          <BlackCube active={false} />
        </group>
      </>
    );
  }

  return (
    <>
      <Stage floor floorY={-1.6} intensity={1.05} />
      <PresentationControls
        global
        cursor
        snap
        speed={1.2}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 2, Math.PI / 2]}
      >
        <group ref={holder}>
          {/* stable interaction target — the box wakes on touch/hover */}
          <mesh
            onPointerOver={wake}
            onPointerDown={wake}
            onPointerOut={rest}
            onPointerUp={rest}
          >
            <sphereGeometry args={[1.7, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <BlackCube active={active} />
          <MorphCore active={active} />
        </group>
      </PresentationControls>
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
