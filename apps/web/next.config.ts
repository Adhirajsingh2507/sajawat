import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Source-only workspace packages compiled by Next (AD-1: ui ships TSX source).
  // Linting is owned by the root flat config via `turbo run lint`; Next 16 no
  // longer runs ESLint during builds, so no eslint config is needed here.
  transpilePackages: ['@sajawat/ui'],

  // Self-contained server output for Docker (0.8, AD-24). Trace from the
  // monorepo root so workspace deps land in `.next/standalone`.
  output: 'standalone',
  outputFileTracingRoot: path.join(dirname, '../../'),
};

export default nextConfig;
