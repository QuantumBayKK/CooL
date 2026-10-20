"use client";

import { useEffect, useRef, useState } from "react";

import { RECORDER_STEPS } from "@/content/copy";
import { readMotionProfile } from "@/lib/film/reducedMotion";

import { RECORDER_SEQ, frameUrl, loadSequence, nearest } from "./frames";

/**
 * Sequence A — recorder to receipt.
 *
 * A pinned, scroll-scrubbed push-in on illustrative hardware footage. As the
 * camera closes on the spindle the four steps resolve, and at the end a
 * receipt card slides out. The receipt fields are copied from the published
 * conformance vector valid-receipt-with-inclusion.json — real values from a
 * real (mock-attested) fixture, labelled as such, not invented hashes.
 *
 * Below 760px or under reduced motion the section is not pinned: one still
 * frame, every step stacked, the receipt inline.
 */

const RECEIPT = {
  schema: "cool.receipt.v1",
  record_id: "01J6XR7K8M2Q3N5P7R9TVWXYZ1",
  model: "acme/credit-scorer@2026.06.0",
  binding: "mh:sha256:9865438f…c0f7f64c",
  sig: "ml-dsa-65+ed25519",
  key: "cool-sign-2026Q2-01",
} as const;

export function RecorderSequence() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLElement>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pinned" | "static">("static");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const p = readMotionProfile();
    const narrow = matchMedia("(max-width: 760px)").matches;
    setMode(p.reduced || narrow ? "static" : "pinned");
  }, []);

  useEffect(() => {
    if (mode !== "pinned") return;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    let progress = 0;
    let drawn = -1;
    let frames: (HTMLImageElement | null)[] = [];
    let cancel = () => {};
    // Fetch frames only when the section is within a screen of the viewport.
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        near.disconnect();
        const seq = loadSequence(RECORDER_SEQ, () => draw(true));
        frames = seq.frames;
        cancel = seq.cancel;
      },
      { rootMargin: "100% 0px" },
    );
    if (root.current) near.observe(root.current);

    const draw = (force = false) => {
      const i = Math.min(RECORDER_SEQ.count - 1, Math.round(progress * (RECORDER_SEQ.count - 1)));
      if (i === drawn && !force) return;
      const img = nearest(frames, i);
      if (img) {
        ctx.drawImage(img, 0, 0);
        drawn = i;
      }
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = root.current!;
      const r = el.getBoundingClientRect();
      const total = r.height - innerHeight;
      progress = Math.max(0, Math.min(1, -r.top / Math.max(1, total)));
      draw();
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      if (receipt.current) {
        const t = Math.max(0, Math.min(1, (progress - 0.58) / 0.24));
        receipt.current.style.setProperty("--rx", `${(1 - t) * 130}%`);
      }
      let s = 0;
      RECORDER_STEPS.forEach((st, idx) => {
        if (progress >= st.at) s = idx;
      });
      setStep(s);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      near.disconnect();
      cancel();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode]);

  const pinned = mode === "pinned";

  return (
    <section
      ref={root}
      className={`f-section f-section--flush f-scrub${pinned ? "" : " f-scrub--static"}`}
      style={{ height: pinned ? "320vh" : undefined, paddingBlock: 0 }}
      aria-labelledby="seq-a-title"
    >
      <h2 id="seq-a-title" className="f-sr">
        Sequence A — from a change to a receipt
      </h2>
      <div className="f-scrub__sticky">
        {pinned ? (
          <canvas
            ref={canvas}
            className="f-scrub__canvas"
            width={RECORDER_SEQ.width}
            height={RECORDER_SEQ.height}
            aria-hidden="true"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- 1-bit PNG, must not be resampled
          <img
            className="f-scrub__canvas"
            src={frameUrl(RECORDER_SEQ, 60)}
            alt=""
            width={640}
            height={360}
            loading="lazy"
            aria-hidden="true"
          />
        )}
        {pinned && (
          <>
            <div className="f-scrub__progress" aria-hidden="true">
              <i ref={bar} style={{ transform: "scaleX(0)" }} />
            </div>
            <div className="f-scrub__overlay">
              <div className="f-wrap" style={{ display: "grid", alignItems: "end" }}>
                {RECORDER_STEPS.map((s, i) => (
                  <div
                    key={s.label}
                    className="f-scrub__step"
                    data-on={i === step}
                    aria-hidden="true"
                    style={{ gridArea: "1 / 1" }}
                  >
                    <p className="f-label">{s.label}</p>
                    <p className="f-h2" style={{ marginTop: 12 }}>
                      {s.title}
                    </p>
                    <p className="f-lead" style={{ marginTop: 16 }}>
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <Receipt ref={receipt} />
          </>
        )}
      </div>
      {!pinned && (
        <div className="f-wrap" style={{ paddingBlock: "48px 96px" }}>
          <div className="f-grid">
            {RECORDER_STEPS.map((s) => (
              <div key={s.label} className="f-span-3">
                <p className="f-label">{s.label}</p>
                <p className="f-h3" style={{ marginTop: 10 }}>
                  {s.title}
                </p>
                <p className="f-body f-small" style={{ marginTop: 8 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <Receipt />
        </div>
      )}
      {/* The step text, always available to assistive tech regardless of scroll. */}
      {pinned && (
        <ol className="f-sr">
          {RECORDER_STEPS.map((s) => (
            <li key={s.label}>
              {s.title} {s.body}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Receipt({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="f-receipt" role="group" aria-label="Example receipt fields">
      <p style={{ margin: "0 0 10px", fontWeight: 600 }}>RECEIPT · conformance vector</p>
      <dl>
        <dt>schema</dt>
        <dd>{RECEIPT.schema}</dd>
        <dt>record</dt>
        <dd>{RECEIPT.record_id}</dd>
        <dt>model</dt>
        <dd>{RECEIPT.model}</dd>
        <dt>binding</dt>
        <dd>{RECEIPT.binding}</dd>
        <dt>sig</dt>
        <dd>{RECEIPT.sig}</dd>
        <dt>key</dt>
        <dd>{RECEIPT.key}</dd>
      </dl>
      <p style={{ margin: "10px 0 0", fontSize: "0.6875rem" }}>
        Fields from valid-receipt-with-inclusion.json — a published test vector sealed with the mock attestor.
      </p>
    </div>
  );
}
