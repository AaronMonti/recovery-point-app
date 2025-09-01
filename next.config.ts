import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /LICENSE$/,
      type: "asset/source", // lo trata como texto plano
    })
  }
};

export default nextConfig;
