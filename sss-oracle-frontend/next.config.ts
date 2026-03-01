import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3003/:path*", // Proxy to NestJS backend
      },
    ];
  },
};

export default nextConfig;
