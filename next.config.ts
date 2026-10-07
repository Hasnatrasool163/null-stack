import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep visited pages in the client cache for 5 min so going back to a page
    // is instant (no skeleton). <RevalidateOnRevisit /> refreshes it in the background.
    staleTimes: { dynamic: 300 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
