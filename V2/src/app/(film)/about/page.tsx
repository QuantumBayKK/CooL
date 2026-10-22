import type { Metadata } from "next";
import Image from "next/image";

import { Ecosystem } from "@/components/film/Ecosystem";
import { PageHead, SectionHead } from "@/components/film/SectionHead";
import { BOOKING_URL } from "@/content/claims";
import { FOUNDERS } from "@/content/copy";

export const metadata: Metadata = {
  title: "About",
  description:
    "Northwind Cipher is Pranauv Shrinaath S (Founder & CEO, post-quantum cryptography) and Kailosh Kalimuthu (Co-Founder & CTO, trusted execution environments). Coimbatore, India.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHead
        label="About Northwind Cipher"
        title="Applied post-quantum cryptography, and confidential compute."
        lead="Two founders, Coimbatore, India. Nothing below is claimed beyond what is listed, and every line is one click from being checked."
      />
      <section className="f-section f-section--flush" aria-labelledby="a-why">
        <div className="f-wrap f-grid">
          <div className="f-span-6 f-stack">
            <p className="f-label" style={{ color: "var(--brand)" }}>
              Why we exist
            </p>
            <h2 id="a-why" className="f-h2">
              AI systems change every week. The record of what changed should not depend on trust.
            </h2>
          </div>
          <div className="f-span-6 f-stack">
            <p className="f-body">
              When a model is swapped, a prompt edited or a tool granted, someone will later ask what was live and
              whether the record was touched since. Today the answer is usually a log the operator controls.
            </p>
            <p className="f-body">
              We build CooL so the answer is a receipt anyone can check — sealed with post-quantum signatures, in a
              transparency log, and on confidential hardware bound to the code that ran. We publish our evidence with
              its limits, because a product whose promise is &ldquo;verify it yourself&rdquo; has to be verifiable
              itself.
            </p>
            <div className="f-tablewrap">
              <table className="f-table" style={{ minWidth: 0 }}>
                <tbody>
                  <tr>
                    <th scope="row">Company</th>
                    <td>Northwind Cipher Pvt. Ltd.</td>
                  </tr>
                  <tr>
                    <th scope="row">Based in</th>
                    <td>Coimbatore, India</td>
                  </tr>
                  <tr>
                    <th scope="row">Programme</th>
                    <td>NVIDIA Inception member</td>
                  </tr>
                  <tr>
                    <th scope="row">Product</th>
                    <td>CooL — cool-nwc on npm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="f-section f-alt" aria-label="Founders">
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
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="f-btn" style={{ marginTop: 40 }}>
            Book a call with the founders ↗
          </a>
        </div>
      </section>
    </>
  );
}
