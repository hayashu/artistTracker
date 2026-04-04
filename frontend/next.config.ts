import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s1.ticketm.net",
      },
      {
        protocol: "https",
        hostname: "*.ticketmaster.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("canvas");
    }
    return config;
  },
};

export default nextConfig;
