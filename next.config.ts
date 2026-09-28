import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["getdozen.dev", "www.getdozen.dev"],
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["date-fns", "posthog-js"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.getdozen.dev" }],
        destination: "https://getdozen.dev/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "getdozen.vercel.app" }],
        destination: "https://getdozen.dev/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
