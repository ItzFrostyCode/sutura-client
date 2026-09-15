import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both hostnames are used interchangeably in local dev (see the images
  // remotePatterns note below) — allow dev-resource requests (HMR, etc.)
  // from 127.0.0.1 too, not just localhost, so either URL works.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      // Laravel backend serves shop logos, gallery photos, catalog images, etc.
      // from its own storage disk — both hostnames are used interchangeably in local dev.
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },
      // Seeded demo services/catalog items reference stock photos from Unsplash.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;

