import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static site for GitHub Pages
  basePath: "/darts-score",
  images: { unoptimized: true },
  devIndicators: false, // the dev badge sits over the bottom nav and blocks e2e clicks
};

export default nextConfig;
