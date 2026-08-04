/**
 * The landing header.
 *
 * Not the deck's `Nav`. That one carries scroll-spy, a magnetic hover tile and
 * framer-motion, which is the right amount of machinery for a presentation and
 * the wrong amount for the page that has to load fast on a phone over 4G. This
 * is a server component with no JavaScript at all.
 *
 * On a phone it shows the wordmark and one action, because a hamburger holding
 * links nobody opens is a worse use of the space than the button they came to
 * press. The full set of routes lives in the footer, where a phone reader
 * actually looks for them.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const LINKS = [
  { href: "/demo", label: "Demo" },
  { href: "/why", label: "Why" },
  { href: "/sdk", label: "SDK" },
  { href: "#pricing", label: "Pricing" },
];

export function LandingNav() {
  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-line/80 bg-void/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-[17px] font-semibold tracking-[-0.01em] text-ink"
        >
          CooL
        </Link>

        <nav aria-label="Main" className="hidden gap-6 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14.5px] text-mist transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/demo"
          className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-verify px-4 text-[14.5px] font-semibold text-[#06121f] transition-[filter] hover:brightness-95"
        >
          See it work
          <ArrowRight className="size-[15px]" strokeWidth={2.4} />
        </Link>
      </div>
    </div>
  );
}
