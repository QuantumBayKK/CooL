import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // three.js ships untranspiled ESM addons; let Next transpile them.
  transpilePackages: ["three"],
  experimental: {
    // Keep heavy 3D/animation libs out of the server bundle graph where possible.
    optimizePackageImports: ["@react-three/drei", "framer-motion"],
  },
};

export default nextConfig;
