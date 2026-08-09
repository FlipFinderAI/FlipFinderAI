
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.rightmove.co.uk",
      },
    ],
  },
};

export default nextConfig;