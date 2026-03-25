import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "admin.traditions-mode.com" },
      { protocol: "https", hostname: "traditions-mode.com" },
      { protocol: "https", hostname: "www.traditions-mode.com" },
    ],
  },
};

export default nextConfig;
