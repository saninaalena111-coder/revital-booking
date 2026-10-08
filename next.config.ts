import type { NextConfig } from "next";

// Для GitHub Pages сайт живёт в подпапке /revital-booking — путь задаётся в CI
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Прототип полностью статический: сборка в папку out/ для любого хостинга
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
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
