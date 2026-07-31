"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import Stage from "./Stage";
import { applyFinish, type Finish } from "./materials";
import { useScrollCamera, type Vec3 } from "./useScrollCamera";

const DRACO = "/draco/";

/**
 * One supplied GLB, one concept, one section. Studio-lit, idle breathing
 * only, camera glides with the section's scroll. Mounted exclusively when
 * the model exists in public/models (see models.generated.ts).
 */
export default function ConceptScene({
  model,
  sectionId,
  finish = "titanium",
  size = 2.2,
  from = [0.8, 0.5, 5.2],
  to = [-0.5, -0.1, 4.2],
}: {
  model: string;
  sectionId: string;
  finish?: Finish;
  size?: number;
  from?: Vec3;
  to?: Vec3;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`/models/${model}.glb`, DRACO);

  useEffect(() => {
    applyFinish(scene, finish);
  }, [scene, finish]);

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const s = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(s.x, s.y, s.z) || 1;
    return size / maxDim;
  }, [scene, size]);

  useScrollCamera(sectionId, { from, to, lookAt: [0, 0, 0], drift: 0.08 });

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.y = Math.sin(t * 0.55) * 0.04;
    g.rotation.y = Math.sin(t * 0.22) * 0.05; // sway, not spin
  });

  return (
    <>
      <Stage floor floorY={-1.35} intensity={0.9} />
      <group ref={group} scale={fit}>
        <primitive object={scene} />
      </group>
    </>
  );
}
