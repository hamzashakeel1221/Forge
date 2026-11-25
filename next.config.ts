import type { NextConfig } from "next";

/**
 * Forge has no server code, so it ships as a fully static site (`npm run build` writes ./out).
 * That output is served by Cloudflare Workers static assets (see wrangler.jsonc), and also works
 * on Vercel, Netlify, GitHub Pages or any other static host.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  transpilePackages: ["three"],
  images: { unoptimized: true },
};

export default nextConfig;
