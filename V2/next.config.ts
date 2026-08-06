import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,

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
