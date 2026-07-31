import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/**
 * The social card, generated at build time.
 *
 * Deliberately built from layout primitives and system fonts rather than a
 * fetched webfont: an OG image that depends on a network call is an OG image
 * that intermittently fails to render, and a broken unfurl on the one link an
 * investor pastes into their partner channel is an expensive bug.
 */
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1117",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* the blue pool the whole site is lit by */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(88,166,255,0.30) 0%, rgba(88,166,255,0.06) 45%, rgba(13,17,23,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "#f0f6fc",
              letterSpacing: -1,
              display: "flex",
            }}
          >
            CooL
          </div>
          <div
            style={{
              width: 10,
              height: 10,
              background: "#58a6ff",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 20,
              color: "#8b949e",
              letterSpacing: 4,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            The black box for AI
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: "#f0f6fc",
              lineHeight: 1.05,
              letterSpacing: -2.5,
              maxWidth: 940,
              display: "flex",
            }}
          >
            Every AI change — documented, governed and provable. Automatically.
          </div>
          <div
            style={{
              fontSize: 27,
              color: "#c9d1d9",
              lineHeight: 1.35,
              maxWidth: 880,
              display: "flex",
            }}
          >
            Weeks of manual compliance work, deleted. Costs down by up to 90%.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(240,246,252,0.14)",
            paddingTop: 26,
          }}
        >
          <div style={{ fontSize: 21, color: "#8b949e", display: "flex" }}>
            {SITE.company}
          </div>
          <div style={{ fontSize: 21, color: "#3fb950", display: "flex" }}>
            Verify it yourself — northwindcipher.com/demo
          </div>
        </div>
      </div>
    ),
    size,
  );
}
