import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Markdown posts are parsed at build time only; keep the client bundle lean.
  experimental: {
    optimizePackageImports: ["react-icons"],
  },

  async headers() {
    return [
      {
        // The service worker must never be served from a stale HTTP cache,
        // otherwise clients keep an outdated precache manifest forever.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
