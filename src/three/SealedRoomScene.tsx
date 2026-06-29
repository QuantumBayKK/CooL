"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Float, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import type { Group, Mesh } from "three";

/**
 * The Sealed Room as a real R3F scene (Technical Architecture §2). A faceted glass
 * vault whose edges prove the seal, enclosing a glowing core (the protected
 * computation — a TEE), wrapped by an orbiting verification ring and ambient
 * "witness" sparkles. Loaded via dynamic import with SSR disabled.
 */
function Vault() {
  const shell = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const ring = useRef<Group>(null);

  useFrame((_, delta) => {
    if (shell.current) shell.current.rotation.y += delta * 0.12;
    if (core.current) {
      core.current.rotation.y -= delta * 0.3;
      core.current.rotation.x += delta * 0.12;
    }
    if (ring.current) ring.current.rotation.z += delta * 0.35;
  });

  return (
    <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.5}>
      {/* Faceted glass shell — the sealed chamber. */}
      <group ref={shell}>
        <mesh>
          <dodecahedronGeometry args={[1.65, 0]} />
          <meshPhysicalMaterial
            color="#0a1016"
            metalness={0.25}
            roughness={0.12}
            transmission={0.55}
            thickness={1.4}
            ior={1.35}
            transparent
            opacity={0.4}
          />
          <Edges threshold={12} color="#67d3e6" />
        </mesh>
        {/* Inner faceting for depth. */}
        <mesh scale={1.18}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#2f9bb0" wireframe transparent opacity={0.12} />
        </mesh>
      </group>

      {/* Orbiting verification ring. */}
      <group ref={ring} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <mesh>
          <torusGeometry args={[2.05, 0.012, 16, 140]} />
          <meshBasicMaterial color="#67d3e6" transparent opacity={0.55} />
        </mesh>
      </group>

      {/* Protected computation — the glowing core. */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color="#cdf6fb"
          emissive="#67d3e6"
          emissiveIntensity={2.2}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Ambient witnesses. */}
      <Sparkles count={70} scale={4} size={2.2} speed={0.3} color="#84e6b8" opacity={0.55} />
    </Float>
  );
}

export default function SealedRoomScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.6, 5.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 5, 4]} intensity={70} color="#67d3e6" />
      <pointLight position={[-5, -2, -3]} intensity={22} color="#d98b5f" />
      <pointLight position={[0, 0, 4]} intensity={14} color="#ffffff" />
      <Vault />
    </Canvas>
  );
}
