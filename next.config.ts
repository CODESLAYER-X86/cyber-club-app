import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Security headers — mirrored from production meal-app
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control",     value: "on" },
        ],
      },
    ];
  },

  // TypeScript errors must be fixed before production build
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,
};

export default nextConfig;
