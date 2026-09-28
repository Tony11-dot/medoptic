import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray lockfile in the home
  // directory otherwise makes Next infer the wrong root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // The accessibility button owns the bottom-left corner.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
