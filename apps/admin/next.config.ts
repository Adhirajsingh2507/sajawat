import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Source-only workspace packages compiled by Next (AD-1: ui ships TSX source).
  transpilePackages: ['@sajawat/ui'],
};

export default nextConfig;
