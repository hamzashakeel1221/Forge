import type { NextConfig } from "next";

// Set STATIC_EXPORT=1 to produce a fully static build in /out (any static host works).
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  ...(isExport ? { output: "export", images: { unoptimized: true }, trailingSlash: true } : {}),
  ...(process.env.BASE_PATH ? { basePath: process.env.BASE_PATH, assetPrefix: process.env.BASE_PATH } : {}),
};

export default nextConfig;
