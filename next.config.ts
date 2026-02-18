import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Reduce unnecessary rebuilds (e.g. from OneDrive sync or other file watcher noise)
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/cache/**"],
        aggregateTimeout: 500,
      };
    }
    return config;
  },
};

export default nextConfig;
