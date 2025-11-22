import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Enable static export for Electron
  output: isProd ? 'export' : undefined,
  
  // Output directory for production build
  distDir: isProd ? '../dist/frontend' : '.next',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Trailing slash for static files
  trailingSlash: true,
};

export default nextConfig;
