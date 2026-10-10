import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 is wired into Turbopack through this loader rule (scaffold default).
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
