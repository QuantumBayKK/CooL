import * as THREE from "three";

/**
 * Manufactured finishes — industrial product photography, never glossy plastic.
 * Applied over supplied GLBs so every object reads as machined hardware.
 */
export type Finish =
  | "ceramic" // matte bone-white ceramic
  | "titanium" // warm grey metal, satin
  | "aluminium" // brushed cool metal
  | "graphite" // matte space-black (carbon)
  | "acrylic" // frosted translucent
  | "original"; // keep the model's own PBR textures

export function makeFinish(finish: Exclude<Finish, "original">): THREE.Material {
  switch (finish) {
    case "ceramic":
      return new THREE.MeshPhysicalMaterial({
        color: "#e9e6e0",
        roughness: 0.45,
        metalness: 0,
        clearcoat: 0.22,
        clearcoatRoughness: 0.6,
      });
    case "titanium":
      return new THREE.MeshStandardMaterial({
        color: "#8d9095",
        metalness: 0.9,
        roughness: 0.36,
        envMapIntensity: 1.45,
      });
    case "aluminium":
      return new THREE.MeshStandardMaterial({
        color: "#c4c9ce",
        metalness: 0.95,
        roughness: 0.24,
        envMapIntensity: 1.5,
      });
    case "graphite":
      /* Lifted a step for the dark set — rim light needs something to catch.
         `envMapIntensity` above 1 is the single biggest lever on how "rendered"
         this reads: it weights the studio environment in the reflection, so the
         lightformer streaks show up as real highlights on the bevels instead of
         a flat dark face. The tighter clearcoat roughness keeps those
         highlights crisp rather than smeared. */
      return new THREE.MeshPhysicalMaterial({
        color: "#272c34",
        metalness: 0.55,
        roughness: 0.38,
        clearcoat: 0.85,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.6,
      });
    case "acrylic":
      return new THREE.MeshPhysicalMaterial({
        color: "#dfe6ee",
        transmission: 0.85,
        thickness: 0.6,
        roughness: 0.38,
        ior: 1.4,
        metalness: 0,
      });
  }
}

/** Override a GLB's materials with a finish and enable shadow participation. */
export function applyFinish(root: THREE.Object3D, finish: Finish): void {
  const mat = finish === "original" ? null : makeFinish(finish);
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mat) mesh.material = mat;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}
