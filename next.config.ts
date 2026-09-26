import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both hostnames are used interchangeably in local dev (see the images
  // remotePatterns note below) — allow dev-resource requests (HMR, etc.)
  // from 127.0.0.1 too, not just localhost, so either URL works.
  allowedDevOrigins: ['127.0.0.1', 'localhost', '127.0.0.1:8080', 'localhost:8080', '127.0.0.1:3000', 'localhost:3000'],
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Laravel backend serves store logos, gallery photos, catalog images, etc.
      // Supports both standard port 8000, Windows fallback port 8080, and other common local ports.
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8001', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8001', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
      // Seeded demo services/catalog items reference stock photos from Unsplash.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/services',
        destination: '/search?tab=services',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

