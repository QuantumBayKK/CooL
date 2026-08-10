import Script from "next/script";

/**
 * Google Analytics 4, configured to collect as little as the tool allows.
 *
 * ── it is off unless someone turns it on ──
 *
 * Renders nothing without `NEXT_PUBLIC_GA_ID`. That is the safe default rather
 * than a convenience: a preview deployment, a fork, or a local run must not
 * quietly report into the production property, and an analytics tag that ships
 * enabled-by-default is how staging traffic ends up polluting real numbers.
 *
 * ── the configuration is the point ──
 *
 * `anonymize_ip` truncates the address before it is stored, and the two
 * `allow_*` flags switch off the advertising and remarketing features that
 * make GA a cross-site profiler rather than a page counter. Those flags are
 * why the privacy policy can honestly say no advertising profile is built —
 * that page and this file have to stay true to each other, so if either
 * changes, the other must.
 *
 * ── CSP ──
 *
 * `strategy="afterInteractive"` means Next injects a normal `<script src>`,
 * which the site's Content-Security-Policy must allow. Both googletagmanager
 * (the tag) and google-analytics (the collection endpoint) are added to
 * `script-src` and `connect-src` in `middleware.ts`, and ONLY when a GA ID is
 * configured — a deployment without analytics keeps the tighter policy rather
 * than carrying holes for a tool it does not load.
 *
 * ── what is deliberately not here ──
 *
 * No consent banner. The honest reason is that one is probably required for
 * EU visitors under ePrivacy, and a correct implementation gates the tag on a
 * real consent signal rather than decorating the page with a dismissible bar
 * that loads the tag anyway. Building the fake version would be worse than
 * building none. If this site starts targeting EU traffic, the tag should move
 * behind Consent Mode v2 and the privacy policy updated with it.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
    </>
  );
}

/** True when a measurement ID is configured, so the CSP can widen to match. */
export const analyticsEnabled = () => Boolean(process.env.NEXT_PUBLIC_GA_ID);
