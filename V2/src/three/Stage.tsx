"use client";

import { useMemo } from "react";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";

/**
 * The studio — claymorphic: big soft wraparound light, no hard edges.
 *
 * There is no ray tracing in a browser at this budget, so the thing that
 * actually sells "rendered" here is image-based lighting: a GPU-generated
 * environment the materials reflect, rather than a few point lights. The
 * lightformers below ARE the reflections you see in the metal — widen one and
 * the highlight on the object widens with it.
 *
 * Quality is chosen per device. A phone gets a smaller environment cubemap and
 * a smaller shadow map, because this scene is decorative and a dropped frame on
 * the hero costs more than a slightly softer reflection. Both are computed once
 * (`frames={1}`), so the cost is a single bake, not a per-frame charge.
 */
export default function Stage({
  floor,
  floorY = -1.5,
  animatedShadows = false,
  intensity = 1,
}: {
  /** render a soft contact shadow pool under the object */
  floor?: boolean;
  floorY?: number;
  /** re-render shadows every frame (moving objects) */
  animatedShadows?: boolean;
  intensity?: number;
}) {
  /* Safe to read `window` during render: every scene mounts inside a Canvas
     that is dynamically imported with `ssr: false`, so this never runs on the
     server and cannot cause a hydration mismatch. */
  const quality = useMemo(() => {
    if (typeof window === "undefined") return { env: 256, shadow: 2048, res: 512 };
    const small = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    return small
      ? { env: 128, shadow: 1024, res: 256 }
      : { env: 256, shadow: 2048, res: 512 };
  }, []);

  return (
    <>
      <Environment resolution={quality.env} frames={1}>
        {/* huge overhead softbox — soft clay key, no hotspot */}
        <Lightformer
          intensity={2.1 * intensity}
          position={[0, 5, 1.5]}
          rotation={[-Math.PI / 2.4, 0, 0]}
          scale={[14, 8, 1]}
          form="ring"
          color="#f4f8ff"
        />
        {/* wide blue bloom behind the object — the "glow behind it" */}
        <Lightformer
          intensity={1.6 * intensity}
          position={[0, 0.5, -5]}
          rotation={[0, Math.PI, 0]}
          scale={[11, 7, 1]}
          form="rect"
          color="#58a6ff"
        />
        {/* soft wrap fill, left */}
        <Lightformer
          intensity={1.0 * intensity}
          position={[-5.5, 1, 0]}
          rotation={[0, Math.PI / 2.6, 0]}
          scale={[7, 4, 1]}
          form="rect"
          color="#e8eef6"
        />
        {/* soft wrap fill, right — faint cool */}
        <Lightformer
          intensity={0.8 * intensity}
          position={[5.5, 0.5, -1]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[6, 3.5, 1]}
          form="rect"
          color="#9cc4f0"
        />
        {/* Specular catch — small, bright, high and slightly off-axis.
            A big soft box alone makes metal read as matte plastic because
            nothing in the environment is small enough to reflect as a distinct
            highlight. This is that highlight, and it is what makes the edges
            of the object look machined rather than drawn. */}
        <Lightformer
          intensity={5.5 * intensity}
          position={[-2.4, 3.6, 2.2]}
          rotation={[-Math.PI / 3, 0, Math.PI / 6]}
          scale={[1.6, 0.35, 1]}
          form="rect"
          color="#ffffff"
        />
        {/* A second, dimmer streak on the opposite edge, so a turning object
            catches light continuously instead of flashing once per rotation. */}
        <Lightformer
          intensity={2.6 * intensity}
          position={[3.1, 1.8, 2.6]}
          rotation={[-Math.PI / 5, 0, -Math.PI / 5]}
          scale={[1.1, 0.28, 1]}
          form="rect"
          color="#dceaff"
        />
      </Environment>

      {/* shadow-casting key — soft and high */}
      <directionalLight
        position={[2.5, 7, 5]}
        intensity={0.85 * intensity}
        castShadow
        shadow-mapSize={[quality.shadow, quality.shadow]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={8}
      />
      {/* rim from behind — lifts the silhouette off the dark backdrop */}
      <directionalLight position={[-4, 3, -5]} intensity={0.9 * intensity} color="#7fb3f5" />
      <directionalLight position={[4, -1, -4]} intensity={0.45 * intensity} color="#58a6ff" />
      {/* generous ambient — clay never falls to black */}
      <ambientLight intensity={0.4 * intensity} />

      {floor && (
        <ContactShadows
          position={[0, floorY, 0]}
          opacity={0.55}
          scale={13}
          blur={3.4}
          far={4.5}
          resolution={quality.res}
          frames={animatedShadows ? Infinity : 1}
        />
      )}
    </>
  );
}
