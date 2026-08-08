import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sleepercdn.com",
        pathname: "/avatars/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/records", destination: "/history", permanent: true },
      { source: "/standings", destination: "/season", permanent: true },
      { source: "/recaps", destination: "/storylines", permanent: true },
    ];
  },
};

export default nextConfig;
