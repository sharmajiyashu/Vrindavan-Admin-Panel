import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3qyrkd33l2bc9.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
