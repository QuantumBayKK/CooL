import { CLAIMS, EVIDENCE_URL } from "@/content/claims";

import { HudFrame, StatusChip } from "./HudFrame";

/**
 * Programme and infrastructure references. Each line is the claim registry's
 * permitted wording; none implies endorsement or a signed partnership.
 */
export function Ecosystem() {
  return (
    <div className="f-grid">
      <HudFrame className="f-span-4 f-hud--fill" index="Programme" meta={<StatusChip status="Member" />}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#76B900" d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
          </svg>
          <span className="f-h3">NVIDIA Inception</span>
        </div>
        <p className="f-body f-small" style={{ marginTop: 14 }}>
          {CLAIMS.nvidiaInception.wording}
        </p>
      </HudFrame>
      <HudFrame className="f-span-4 f-hud--fill" index="Infrastructure" meta={<StatusChip status="In use" />}>
        <div style={{ display: "flex", alignItems: "center", height: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/partners/phala.svg" alt="Phala" width={104} height={36} />
        </div>
        <p className="f-body f-small" style={{ marginTop: 14 }}>
          {CLAIMS.phalaInfra.wording}{" "}
          <a className="f-link" href={EVIDENCE_URL} target="_blank" rel="noopener">
            See the evidence
          </a>
        </p>
      </HudFrame>
      <HudFrame className="f-span-4 f-hud--fill" index="Collaboration" meta={<StatusChip status={CLAIMS.edgeless.status} />}>
        <div style={{ display: "flex", alignItems: "center", height: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static PNG logo */}
          <img src="/partners/edgeless-systems.png" alt="Edgeless Systems" width={100} height={36} />
        </div>
        <p className="f-body f-small" style={{ marginTop: 14 }}>
          {CLAIMS.edgeless.wording}
        </p>
      </HudFrame>
    </div>
  );
}
