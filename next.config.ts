import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ktuahohvysmjxumekaov.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow Supabase video responses to be played in browser
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Embedder-Policy",  value: "unsafe-none" },
          { key: "Cross-Origin-Opener-Policy",    value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;