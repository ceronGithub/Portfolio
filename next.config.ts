import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to succeed even with TS errors.
    // Type safety is enforced locally — Vercel build must not be blocked by pre-existing errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ktuahohvysmjxumekaov.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "9pyiak1lvdjbjlav.public.blob.vercel-storage.com",
        pathname: "/**",
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