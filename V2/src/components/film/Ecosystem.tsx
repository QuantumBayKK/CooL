import { CLAIMS, EVIDENCE_URL } from "@/content/claims";

import { HudFrame, StatusChip } from "./HudFrame";

/**
 * Programme and infrastructure references, rendered in monochrome. Each line
 * is the registry's permitted wording; none implies endorsement or a signed
 * partnership.
 */
export function Ecosystem() {
  return (
    <div className="f-grid">
      <HudFrame
        className="f-span-4"
        index="Programme"
        meta={<StatusChip status={CLAIMS.nvidiaInception.status} />}
      >
        <svg width="132" height="28" viewBox="0 0 132 28" fill="currentColor" aria-label="NVIDIA Inception" role="img">
          <path d="M8.9 9.8V8.4l.4-.02c3.9-.12 6.5 3.37 6.5 3.37s-2.77 3.85-5.75 3.85c-.4 0-.79-.06-1.16-.18v-4.35c1.53.18 1.84.86 2.75 2.38l2.04-1.71s-1.5-1.95-4-1.95c-.27 0-.53.01-.8.03m0-4.73v2.14l.43-.03c5.45-.18 9 4.47 9 4.47s-4.08 4.96-8.33 4.96c-.37 0-.73-.03-1.1-.1v1.33c.3.04.61.06.91.06 3.96 0 6.82-2.02 9.6-4.4.45.37 2.34 1.26 2.73 1.65-2.63 2.2-8.77 3.98-12.25 3.98-.34 0-.66-.02-.97-.05v1.86H24V5.06zM8.9 15.4v1.13c-3.66-.65-4.68-4.46-4.68-4.46s1.76-1.94 4.68-2.26v1.24c-1.53-.19-2.73 1.24-2.73 1.24s.68 2.41 2.73 3.11M2.46 11.9s2.16-3.2 6.5-3.53V7.2C4.15 7.6 0 11.65 0 11.65s2.35 6.8 8.95 7.42v-1.24c-4.84-.6-6.49-5.93-6.49-5.93z" />
          <text x="30" y="19" fontFamily="var(--f-display)" fontWeight="700" fontSize="14" letterSpacing="-0.02em">
            NVIDIA Inception
          </text>
        </svg>
        <p className="f-body f-small" style={{ marginTop: 16 }}>
          {CLAIMS.nvidiaInception.wording}
        </p>
      </HudFrame>
      <HudFrame className="f-span-4" index="Infrastructure" meta={<StatusChip status={CLAIMS.phalaInfra.status} />}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
        <img src="/partners/phala-mono.svg" alt="Phala" width={101} height={35} />
        <p className="f-body f-small" style={{ marginTop: 16 }}>
          {CLAIMS.phalaInfra.wording}{" "}
          <a className="f-link" href={EVIDENCE_URL} target="_blank" rel="noopener">
            Evidence ↗
          </a>
        </p>
      </HudFrame>
      <HudFrame className="f-span-4" index="In progress" meta={<StatusChip status={CLAIMS.edgeless.status} />}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 1-bit monochrome copy of the logo */}
        <img src="/partners/edgeless-mono.png" alt="Edgeless Systems" width={98} height={35} />
        <p className="f-body f-small" style={{ marginTop: 16 }}>
          {CLAIMS.edgeless.wording}
        </p>
      </HudFrame>
    </div>
  );
}
