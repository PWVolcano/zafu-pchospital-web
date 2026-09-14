import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/handbook",
        destination: "/handbook/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
