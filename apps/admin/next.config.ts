import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Source-only workspace packages compiled by Next (AD-1: ui ships TSX source).
  // Linting is owned by the root flat config via `turbo run lint`; Next 16 no
  // longer runs ESLint during builds, so no eslint config is needed here.
  transpilePackages: ['@sajawat/ui'],
};

export default nextConfig;
