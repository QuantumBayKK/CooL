"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import Stage from "./Stage";
import { applyFinish } from "./materials";

const MODEL = "/models/bomb.glb";
const DRACO = "/draco/";

const N = 220; // debris field
const G = 7.5; // gravity strength
const SWIRL = 3.2; // tangential pull → accretion disk
const HORIZON = 0.85; // capture radius → jet ejection
const MAX_SPEED = 15;
const DISK_NORMAL = new THREE.Vector3(0.25, 0.85, 0.45).normalize();
const UP = new THREE.Vector3(0, 1, 0);

/* ---------- the falling payload ---------- */
function Bomb({ hole }: { hole: RefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL, DRACO);

  useEffect(() => {
    applyFinish(scene, "original"); // its own machined casing
  }, [scene]);

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return 2.4 / maxDim;
  }, [scene]);

  const sim = useRef({
    pos: new THREE.Vector3(-2.5, 9, -1.5),
    vel: new THREE.Vector3(0, -0.7, 0),
  });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDelta, 0.033);
    const { pos, vel } = sim.current;

    // gravity: constant fall + pull toward the singularity
    vel.y -= 0.25 * dt;
    tmp.copy(hole.current).sub(pos);
    const d2 = Math.max(tmp.lengthSq(), 0.6);
    vel.addScaledVector(tmp.normalize(), (3.2 / d2) * dt);
    vel.clampLength(0, 4);
    pos.addScaledVector(vel, dt);

    // slung out of frame or landed → re-drop
    if (pos.length() > 14 || pos.y < -9) {
      pos.set((Math.random() - 0.5) * 6, 9.5, (Math.random() - 0.5) * 3 - 1);
      vel.set(0, -0.7, 0);
    }

    g.position.copy(pos);
    g.rotation.x += dt * 0.5;
    g.rotation.z += dt * 0.32;
  });

  return (
    <group ref={group} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

/* ---------- the singularity + accretion disk (cursor-driven) ---------- */
function BlackHole({ hole }: { hole: RefObject<THREE.Vector3> }) {
  const group = useRef<THREE.Group>(null);
  const diskA = useRef<THREE.Mesh>(null);
  const diskB = useRef<THREE.Mesh>(null);

  const idle = useRef({ lastPointer: new THREE.Vector2(1e9, 1e9), lastMove: -10 });
  const target = useMemo(() => new THREE.Vector3(), []);
  const proj = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const now = state.clock.elapsedTime;

    // pointer moved? (works for touch-drag too)
    const p = state.pointer;
    if (idle.current.lastPointer.distanceToSquared(p) > 1e-6) {
      idle.current.lastPointer.copy(p);
      idle.current.lastMove = now;
    }

    if (now - idle.current.lastMove < 3) {
      // unproject pointer onto the z=0 plane
      proj.set(p.x, p.y, 0.5).unproject(state.camera);
      proj.sub(state.camera.position).normalize();
      const t = -state.camera.position.z / proj.z;
      target.copy(state.camera.position).addScaledVector(proj, t);
    } else {
      // nobody driving — the singularity wanders (three-body-ish drift)
      target.set(Math.sin(now * 0.4) * 4.5, Math.sin(now * 0.63 + 1.7) * 2.6, 0);
    }
    hole.current.lerp(target, 1 - Math.pow(0.02, delta)); // heavy inertia

    g.position.copy(hole.current);
    // slow gyroscopic precession — alive, not spinning
    if (diskA.current) diskA.current.rotation.x = 0.12 * Math.sin(now * 0.5);
    if (diskB.current) diskB.current.rotation.y = 0.1 * Math.sin(now * 0.34 + 1.2);
  });

  return (
    <group ref={group}>
      {/* event horizon */}
      <mesh>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* faint photon rim — the only luminous element */}
      <mesh>
        <sphereGeometry args={[0.355, 24, 24]} />
        <meshBasicMaterial
          color="#e8eef4"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* machined gyroscope rings — the accretion disk as manufactured hardware */}
      <group rotation={[1.15, 0.2, 0]}>
        <mesh ref={diskA} castShadow>
          <torusGeometry args={[0.72, 0.028, 12, 96]} />
          <meshStandardMaterial color="#c4c9ce" metalness={0.95} roughness={0.3} />
        </mesh>
        <mesh ref={diskB} castShadow rotation={[0.18, 0, 0]}>
          <torusGeometry args={[1.18, 0.02, 12, 96]} />
          <meshStandardMaterial color="#6e747b" metalness={0.9} roughness={0.42} />
        </mesh>
      </group>
      <pointLight color="#58a6ff" intensity={1.1} distance={7} />
    </group>
  );
}

/* ---------- projectile swarm: attract → spiral → eject ---------- */
function Swarm({ hole }: { hole: RefObject<THREE.Vector3> }) {
  const inst = useRef<THREE.InstancedMesh>(null);

  const store = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      vel[i * 3] = (Math.random() - 0.5) * 1.4;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return { pos, vel };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const radial = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const jet = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const mesh = inst.current;
    if (!mesh) return;
    const dt = Math.min(rawDelta, 0.033);
    const h = hole.current;
    const { pos, vel } = store;

    for (let i = 0; i < N; i++) {
      const ix = i * 3;
      const px = pos[ix]!, py = pos[ix + 1]!, pz = pos[ix + 2]!;
      v.set(vel[ix]!, vel[ix + 1]!, vel[ix + 2]!);

      radial.set(h.x - px, h.y - py, h.z - pz);
      const d2 = radial.lengthSq();
      const d = Math.sqrt(d2);

      if (d > 1e-4) {
        radial.divideScalar(d);
        // gravity
        v.addScaledVector(radial, (G / Math.max(d2, 0.35)) * dt);
        // swirl → accretion disk orbit
        tangent.crossVectors(DISK_NORMAL, radial);
        v.addScaledVector(tangent, (SWIRL / Math.max(d2, 0.5)) * dt);
      }

      // event horizon → relativistic jet: hurled out along the disk axis
      if (d < HORIZON) {
        jet
          .copy(DISK_NORMAL)
          .multiplyScalar(Math.random() > 0.5 ? 1.3 : -1.3)
          .addScaledVector(radial, -0.7)
          .addScaledVector(
            v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5),
            0.6,
          )
          .normalize();
        v.copy(jet).multiplyScalar(9 + Math.random() * 5.5);
      }

      // damping + speed clamp + soft containment
      v.multiplyScalar(1 - 0.12 * dt);
      const speed = v.length();
      if (speed > MAX_SPEED) v.multiplyScalar(MAX_SPEED / speed);
      v.x -= px * 0.045 * dt;
      v.y -= py * 0.065 * dt;
      v.z -= pz * 0.09 * dt;

      vel[ix] = v.x;
      vel[ix + 1] = v.y;
      vel[ix + 2] = v.z;
      pos[ix] = px + v.x * dt;
      pos[ix + 1] = py + v.y * dt;
      pos[ix + 2] = pz + v.z * dt;

      dummy.position.set(pos[ix]!, pos[ix + 1]!, pos[ix + 2]!);
      const sp = Math.min(v.length(), MAX_SPEED);
      if (sp > 0.01) {
        dummy.quaternion.setFromUnitVectors(UP, v.normalize());
      }
      dummy.scale.set(1, 0.6 + sp * 0.22, 1); // stretch with speed
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, N]} frustumCulled={false} castShadow>
      <boxGeometry args={[0.028, 0.26, 0.028]} />
      <meshStandardMaterial color="#aeb6bf" metalness={0.88} roughness={0.4} />
    </instancedMesh>
  );
}

export default function GravityScene() {
  const hole = useRef(new THREE.Vector3(0, 0, 0));
  return (
    <>
      <Stage intensity={0.8} />
      <Bomb hole={hole} />
      <BlackHole hole={hole} />
      <Swarm hole={hole} />
    </>
  );
}

useGLTF.preload(MODEL, DRACO);
