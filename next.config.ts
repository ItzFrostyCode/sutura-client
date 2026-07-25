import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

