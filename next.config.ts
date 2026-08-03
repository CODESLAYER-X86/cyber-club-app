import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "output: standalone" — Vercel handles its own build output.
  // Standalone mode can conflict with Vercel's serverless runtime.

  // Fix Turbopack workspace root detection
  turbopack: {
    root: ".",
  },

  // Mobile and performance optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,

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
          { key: "Strict-Transport-Security",  value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Content-Security-Policy",    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;" }
        ],
      },
    ];
  },

  // TypeScript errors must be fixed before production build
  typescript: {
    ignoreBuildErrors: false,
  },
};
