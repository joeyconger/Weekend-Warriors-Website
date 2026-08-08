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
      // Rivalries is off the nav "for now" — not permanent, so it's easy to
      // bring back without fighting browser/CDN redirect caching.
      { source: "/rivalries", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
