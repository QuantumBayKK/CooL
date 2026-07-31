"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Trail } from "@react-three/drei";
import Stage from "./Stage";
import { applyFinish } from "./materials";

const MODEL = "/models/cricket.glb";
const DRACO = "/draco/";

const DUR = 2.3;
const START = new THREE.Vector3(-7, 1.4, -170);
const END = new THREE.Vector3(2.6, -0.7, 18);
const CAM_BASE = new THREE.Vector3(0, 0, 6.2);
const BOOM_Z = 4.4; // where the ball crosses the camera plane → sonic boom

export default function FlybyScene({ playKey }: { playKey: number }) {
  const ball = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);
  const shockMat = useRef<THREE.MeshBasicMaterial>(null);
  const flash = useRef<THREE.PointLight>(null);

  const { scene } = useGLTF(MODEL, DRACO);

  useEffect(() => {
    applyFinish(scene, "original"); // the real leather + seam — it's already manufactured
  }, [scene]);

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return 0.9 / maxDim;
  }, [scene]);

  const sim = useRef({
    start: null as number | null,
    boomAt: null as number | null,
    boomPos: new THREE.Vector3(),
  });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    sim.current.start = null;
    sim.current.boomAt = null;
  }, [playKey]);

  useFrame((state, delta) => {
    const s = sim.current;
    const now = state.clock.elapsedTime;
    if (s.start === null) s.start = now;

    const b = ball.current;
    if (!b) return;

    // ---- ball flight ----
    const p = Math.min((now - s.start) / DUR, 1);
    const pe = Math.pow(p, 1.7); // perspective + ease sells the acceleration
    tmp.lerpVectors(START, END, pe);
    b.position.copy(tmp);
    b.rotation.x -= delta * 38; // seam spin
    b.rotation.z += delta * 9;
    b.visible = p < 1;

    // ---- sonic boom trigger ----
    if (s.boomAt === null && tmp.z > BOOM_Z) {
      s.boomAt = now;
      s.boomPos.set(tmp.x * 0.7, tmp.y * 0.7, BOOM_Z - 1.2);
    }

    // ---- camera shake + shockwave + flash ----
    const cam = state.camera;
    if (s.boomAt !== null) {
      const st = now - s.boomAt;
      const amp = 0.34 * Math.exp(-3.6 * st);
      if (amp > 0.002) {
        cam.position.set(
          CAM_BASE.x + (Math.random() - 0.5) * amp,
          CAM_BASE.y + (Math.random() - 0.5) * amp,
          CAM_BASE.z + (Math.random() - 0.5) * amp * 0.5,
        );
        cam.rotation.z = (Math.random() - 0.5) * amp * 0.22;
      } else {
        cam.position.copy(CAM_BASE);
        cam.rotation.z = 0;
      }

      if (shock.current && shockMat.current) {
        shock.current.visible = st < 1;
        shock.current.position.copy(s.boomPos);
        shock.current.scale.setScalar(1 + st * 15);
        shock.current.lookAt(cam.position);
        shockMat.current.opacity = Math.max(0, 0.85 * (1 - st / 0.9));
      }
      if (flash.current) {
        flash.current.position.copy(s.boomPos);
        flash.current.intensity = 60 * Math.exp(-6 * st);
      }
    } else {
      cam.position.copy(CAM_BASE);
      cam.rotation.z = 0;
      if (shock.current) shock.current.visible = false;
      if (flash.current) flash.current.intensity = 0;
    }
  });

  return (
    <>
      <Stage intensity={0.9} />
      <pointLight ref={flash} color="#ffffff" intensity={0} distance={30} />

      <Trail
        width={1.1}
        length={7}
        color="#dfe5ea"
        attenuation={(w) => w * w}
      >
        <group ref={ball} scale={scale}>
          <primitive object={scene} />
        </group>
      </Trail>

      <mesh ref={shock} visible={false}>
        <ringGeometry args={[0.9, 1, 56]} />
        <meshBasicMaterial
          ref={shockMat}
          color="#ffffff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
