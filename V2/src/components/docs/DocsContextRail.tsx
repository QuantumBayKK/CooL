import Link from "next/link";

import type { Doc } from "@/lib/docs";

/** A page guide plus two compact diagrams that keep CooL's data path visible. */
export function DocsContextRail({
  headings,
}: {
  headings: Doc["headings"];
}) {
  return (
    <aside className="docs-context-rail">
      {headings.length > 2 && (
        <details className="docs-mobile-toc">
          <summary><span>On this page</span><span aria-hidden>⌄</span></summary>
          <nav aria-label="On this page">
            {headings.map((heading) => (
              <Link key={heading.id} href={`#${heading.id}`} className={heading.level === 3 ? "is-subheading" : undefined}>
                {heading.text}
              </Link>
            ))}
          </nav>
        </details>
      )}

      {headings.length > 2 && (
        <nav aria-label="On this page" className="docs-toc">
          <p className="docs-rail-label">ON THIS PAGE</p>
          <ul>
            {headings.map((heading) => (
              <li key={heading.id} className={heading.level === 3 ? "is-subheading" : undefined}>
                <Link href={`#${heading.id}`}>{heading.text}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section className="docs-diagram-card" aria-labelledby="docs-flow-title">
        <div className="docs-rail-title-row"><span className="docs-rail-icon" aria-hidden>↗</span><h2 id="docs-flow-title">The evidence path</h2></div>
        <p className="docs-diagram-caption">From a change in your app to a receipt anyone can check.</p>
        <ol className="docs-flow-diagram">
          <li><span className="docs-flow-node docs-flow-node-blue">01</span><span><b>Your app</b><small>Change or inference</small></span></li>
          <li><span className="docs-flow-node">02</span><span><b>CoolTee</b><small>Canonicalize · hash · sign</small></span></li>
          <li><span className="docs-flow-node docs-flow-node-blue">03</span><span><b>Receipt</b><small>Portable evidence record</small></span></li>
          <li><span className="docs-flow-node">04</span><span><b>cool verify</b><small>Independent, offline check</small></span></li>
        </ol>
        <Link href="/docs/quickstart" className="docs-diagram-link">Follow the quickstart <span aria-hidden>→</span></Link>
      </section>

      <section className="docs-diagram-card docs-trust-card" aria-labelledby="docs-trust-title">
        <div className="docs-rail-title-row"><span className="docs-rail-icon" aria-hidden>◈</span><h2 id="docs-trust-title">A smaller trust boundary</h2></div>
        <div className="docs-boundary-diagram">
          <div className="docs-boundary-zone">
            <span className="docs-boundary-label">YOUR ENVIRONMENT</span>
            <b>Keys · log · verifier</b>
            <small>Evidence stays with you</small>
          </div>
          <div className="docs-boundary-bridge"><span>only if enabled</span><i aria-hidden>↔</i></div>
          <div className="docs-boundary-zone docs-boundary-zone-external">
            <span className="docs-boundary-label">OPTIONAL CHECKS</span>
            <b>Witness · TDX · Bitcoin</b>
            <small>Verify history and hardware claims</small>
          </div>
        </div>
        <Link href="/docs/architecture" className="docs-diagram-link">Explore the architecture <span aria-hidden>→</span></Link>
      </section>

      <div className="docs-rail-links">
        <span>KEEP EXPLORING</span>
        <Link href="/docs/receipt-format">Receipt format <span aria-hidden>↗</span></Link>
        <Link href="/docs/verifier-reference">Verifier reference <span aria-hidden>↗</span></Link>
        <Link href="/docs/threat-model">Threat model <span aria-hidden>↗</span></Link>
      </div>
    </aside>
  );
}
