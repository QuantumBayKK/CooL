import type { Metadata } from "next";
import Image from "next/image";

import { Ecosystem } from "@/components/film/Ecosystem";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { BOOKING_URL } from "@/content/claims";
import { FOUNDERS } from "@/content/copy";

export const metadata: Metadata = {
  title: "Team",
  description:
    "Northwind Cipher is Pranauv Shrinaath S (Founder & CEO, post-quantum cryptography) and Kailosh Kalimuthu (Co-Founder & CTO, trusted execution environments). Coimbatore, India.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return (
    <>
      <PageHead
        label="Team · Northwind Cipher Pvt. Ltd."
        title="Applied post-quantum cryptography, and confidential compute."
        lead="Two founders, Coimbatore, India. Nothing below is claimed beyond what is listed, and every line is one click from being checked."
      />
      <section className="f-section f-section--flush" aria-label="Founders">
        <div className="f-wrap f-grid">
          {FOUNDERS.map((f) => (
            <article key={f.name} className="f-span-6 f-stack">
              <figure className="f-portrait">
                <Image src={f.photo} alt={f.name} width={f.w} height={f.h} sizes="(max-width: 1000px) 100vw, 50vw" />
              </figure>
              <p className="f-label">
                {f.role} · {f.focus}
              </p>
              <h2 className="f-h2">{f.name}</h2>
              <p className="f-body">{f.focus}</p>
              <ul className="f-rows" style={{ listStyle: "none", padding: 0 }}>
                {f.points.map((p) => (
                  <li key={p} className="f-body f-small" style={{ padding: "12px 0", borderBottom: "1px solid var(--w-24)" }}>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="f-label">
                <a className="f-link" href={`mailto:${f.email}`}>
                  {f.email}
                </a>{" "}
                ·{" "}
                <a className="f-link" href={f.github} target="_blank" rel="noopener">
                  {f.github.replace("https://", "")} ↗
                </a>
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="f-section" aria-labelledby="t-eco">
        <div className="f-wrap">
          <SectionHead id="t-eco" label="Programmes & infrastructure" title="Who we build alongside." />
          <div style={{ marginTop: 48 }}>
            <Ecosystem />
          </div>
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn" style={{ marginTop: 40 }} data-impact="full">
            Book a call with the founders ↗
          </a>
        </div>
      </section>
    </>
  );
}
