"use client";

import dynamic from "next/dynamic";
import { Pin3D } from "@/components/ui/3d-pin";
import { hasModel } from "@/three/models.generated";
import type { Finish } from "@/three/materials";
import type { Vec3 } from "@/three/useScrollCamera";

const SceneCanvas = dynamic(() => import("@/three/SceneCanvas"), { ssr: false });
const ConceptScene = dynamic(() => import("@/three/ConceptScene"), { ssr: false });

/**
 * Mounts a section's concept model — only if the GLB has been supplied
 * (see "3d models/README.md"). Absent model = nothing renders, layout intact.
 */
export default function ConceptStage({
  model,
  sectionId,
  finish = "titanium",
  caption,
  from,
  to,
}: {
  model: string;
  sectionId: string;
  finish?: Finish;
  caption?: string;
  from?: Vec3;
  to?: Vec3;
}) {
  if (!hasModel(model)) return null;
  return (
    <div className="mb-8">
      <div className="relative">
        <div
          aria-hidden
          className="clay-glow pointer-events-none absolute inset-0 -z-10"
        />
        <SceneCanvas
          className="h-[230px] w-full"
          camera={{ position: from ?? [0.8, 0.5, 5.2], fov: 45 }}
        >
          <ConceptScene
            model={model}
            sectionId={sectionId}
            finish={finish}
            from={from}
            to={to}
          />
        </SceneCanvas>
        <Pin3D label="TEE quote" className="left-[10%] top-[18%] hidden sm:block" />
        <Pin3D label="Signed receipt" className="right-[8%] top-[32%] hidden sm:block" delay={0.15} />
      </div>
      {caption && (
        <p className="mt-2 text-center font-mono text-[11px] tracking-[0.2em] text-mist uppercase">
          {caption}
        </p>
      )}
    </div>
  );
}
