import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wrapped-images.spotifycdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-fa.spotifycdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'daily-mix.scdn.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'seeded-session-images.scdn.co',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
