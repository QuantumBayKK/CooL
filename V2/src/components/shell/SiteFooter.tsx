import Link from "next/link";

import { Wordmark } from "@/components/shell/Wordmark";
import { StatusBadge } from "@/components/ui/primitives";
import { CURRENT_STAGE } from "@/content/gates";
import { FOOTER, SITE } from "@/lib/site";

/**
 * Footer.
 *
 * Four columns of navigation and one honest line about where the product
 * actually is. That line is generated from `gates.ts` rather than typed, so it
 * cannot drift away from the readiness page — and it appears on every page,
 * which is the point: a reader should never get deep into the site without
 * having been told what is simulated.
 */
export function SiteFooter() {
  const stage = CURRENT_STAGE;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <div className="flex flex-col gap-4">
            <Wordmark />
            <p className="max-w-[30ch] text-sm text-ink-muted">
              {SITE.description}
            </p>
            <Link
              href="/security/readiness"
              className="group inline-flex w-fit items-center gap-2"
            >
              <StatusBadge status="warn">
                Stage {stage.n} · {stage.name}
              </StatusBadge>
              <span className="text-xs text-ink-subtle underline-offset-4 group-hover:underline">
                What that means
              </span>
            </Link>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER.map((col) => (
              <div key={col.label}>
                <h2 className="text-label uppercase text-ink-subtle">
                  {col.label}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {col.items.map((item) => {
                    const external = item.href.startsWith("http");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          {...(external
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                          className="text-sm text-ink-muted underline-offset-4 transition-colors duration-[--duration-state] hover:text-ink hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-subtle">
            © {year} {SITE.company}. Apache-2.0 SDK.
          </p>
          <p className="text-xs text-ink-subtle">
            Attestation is simulated today.{" "}
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
