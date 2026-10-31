import Link from "next/link";

import { SiteLink } from "@/components/shell/SiteLink";
import { NcBrand } from "@/components/community/NcLogo";
import { FOOTER, SITE } from "@/lib/site";

/**
 * Footer: the Northwind Cipher mark, four columns of navigation, and the company's current status.
 * The detailed, item-by-item readiness ladder lives on /security/readiness (from `gates.ts`).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="flex flex-col gap-4">
            <NcBrand />
            <p className="max-w-[30ch] text-sm text-ink-muted">
              {SITE.description}
            </p>
            <Link
              href="/security/readiness"
              aria-label="Live and taking pilot clients. See our readiness."
              className="inline-flex w-fit items-center gap-2.5 rounded-full border border-ok/30 bg-ok-wash px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-ok/60"
            >
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-ok" />
              </span>
              Live · Taking pilot clients
            </Link>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER.map((col) => (
              <div key={col.label}>
                <h2 className="text-label uppercase text-ink-subtle">
                  {col.label}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {/* `SiteLink` rather than `next/link`: several of these go
                      to the marketing pages and the Studio, which are static
                      HTML the router does not serve. It sorts external from
                      standalone from route on its own. */}
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <SiteLink
                        href={item.href}
                        className="text-sm text-ink-muted underline-offset-4 transition-colors duration-[--duration-state] hover:text-ink hover:underline"
                      >
                        {item.label}
                      </SiteLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-subtle">
            © {year} {SITE.company}. BUSL-1.1 SDK. Member of NVIDIA Inception.
          </p>
          <p className="text-xs text-ink-subtle">
            Attestation verified on Phala Cloud Intel TDX.{" "}
            <Link
              href="/security#simulated"
              className="text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              Read what that does and does not prove
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
