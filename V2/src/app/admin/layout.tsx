import type { Metadata } from "next";

/**
 * Admin tree. Never indexed, never cached — see the investor layout for the
 * reasoning; it applies with more force here.
 *
 * `data-surface="console"` demotes red to failure-only across the whole admin
 * console. A "Revoke" button that is the same colour as the brand accent would
 * be the exact confusion this system is built to avoid: in here, red means the
 * thing you are about to click destroys something.
 */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — CooL admin" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-surface="console">{children}</div>;
}
