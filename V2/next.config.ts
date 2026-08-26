import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

  /**
   * Tag every `/_next/static` URL with the deployment that produced it.
   *
   * ── the bug this fixes ──
   *
   * Static assets are served with `Cache-Control: public, max-age=31536000,
   * immutable`, which is correct only if a filename can never refer to two
   * different files. Turbopack does not guarantee that: its chunk names come
   * from the module graph, not from a content hash, so a build whose CSS
   * changed can emit the *same* filename as the build before it.
   *
   * When that happens the deployment succeeds, the HTML is new, and the
   * stylesheet silently is not — the CDN answers the request from its
   * immutable cache and never revalidates. Observed exactly that: a deployment
   * whose HTML carried the new font classes while
   * `/_next/static/immutable/chunks/2au1rdpxk2pmi.css` still served the
   * previous build's `--font-display: var(--font-plex)`, with
   * `x-vercel-cache: HIT`. The whole type system change shipped and had no
   * effect, and nothing anywhere reported an error.
   *
   * `deploymentId` appends `?dpl=<id>` to every static asset URL, so each
   * deployment addresses its own copies and a reused chunk name can no longer
   * collide with a cached predecessor. It also gives skew protection for free:
   * a client mid-session keeps requesting the assets of the build it loaded.
   *
   * `VERCEL_DEPLOYMENT_ID` is injected by Vercel at build time. Locally it is
   * undefined and the option is inert, which is what we want — the dev server
   * does not cache like this.
   */
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,

  // Next 16 writes AGENTS.md and CLAUDE.md into the repo root on every build.
  // They are generated artifacts, so they are not tracked — a generated file in
  // version control produces a diff on every build and a merge conflict on
  // every branch.
  agentRules: false,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  /**
   * `/pipeline` was the demo's old home. It is now `/demo`, which is a name a
   * visitor can guess and which says what the page is for.
   *
   * Permanent (308) rather than temporary: the old URL is not coming back, and
   * a 308 transfers the ranking signals of anything that ever linked to it.
   * The redirect stays indefinitely — a link in someone's notes from last month
   * costs nothing to honour and a 404 costs a reader.
   */
  async redirects() {
    return [{ source: "/pipeline", destination: "/demo", permanent: true }];
  },

  /**
   * `/studio` is not a React route any more — it is the CooL Recorder, a
   * self-contained static app vendored into `public/studio/`.
   *
   * Next serves `public/` files at their literal path, so the console is
   * reachable at `/studio/index.html` and nowhere else. That is not a URL to
   * put in a nav bar, and it is not the URL the sitemap, the footer and every
   * existing inbound link already point at. This rewrite makes `/studio` serve
   * that file while leaving the address bar alone.
   *
   * It is an `afterFiles` rewrite (the plain-array form), which is what we
   * want: it fires only once the router and the public directory have both
   * declined the request, so it can never shadow a real route someone adds at
   * `/studio/...` later.
   *
   * The reason the URL keeps no trailing slash — and the reason `index.html`
   * loads its bundle from `/studio/bundle.js` rather than `./bundle.js` — is
   * that a rewrite does not change the document's base URL. Served at
   * `/studio`, a relative specifier resolves against the site root and 404s.
   * The absolute path in the HTML is load-bearing; see the comment there.
   */
  async rewrites() {
    return [{ source: "/studio", destination: "/studio/index.html" }];
  },

  // `poweredByHeader` advertises the framework and version to anyone reading
  // response headers, which is free reconnaissance and buys nothing.
  poweredByHeader: false,
};

export default nextConfig;
