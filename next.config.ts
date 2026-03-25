import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "admin.traditions-mode.com" },
      { protocol: "https", hostname: "traditions-mode.com" },
      { protocol: "https", hostname: "www.traditions-mode.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
