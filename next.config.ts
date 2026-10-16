import path from "node:path";
import type { NextConfig } from "next";

// Akar project (dipakai turbopack & file tracing biar gak naik ke folder home)
const root = path.join(__dirname);

const nextConfig: NextConfig = {
  turbopack: { root },
  outputFileTracingRoot: root,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
