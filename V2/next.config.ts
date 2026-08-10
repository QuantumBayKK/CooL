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

  // `poweredByHeader` advertises the framework and version to anyone reading
  // response headers, which is free reconnaissance and buys nothing.
  poweredByHeader: false,
};

export default nextConfig;
