/**
 * Shared Vitest building blocks (Milestone 0.9). Consumed by each package's
 * `vitest.config.ts`. No runtime dependency on vitest here — packages provide it.
 *
 * Two resolution concerns are solved so tests run against TS **source**:
 *  1. NodeNext relative `.js` specifiers → their `.ts` sibling (AD-32).
 *  2. `@sajawat/*` package imports → that package's `src` entry (AD-32).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// packages/config/vitest -> repo root
const repoRoot = path.resolve(here, '../../..');

/** Vite plugin: rewrite relative `./x.js` imports to `./x.ts` when the source exists. */
export function nodeNextTsResolver() {
  return {
    name: 'sajawat:nodenext-js-to-ts',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined): string | null {
      if (importer === undefined || !source.startsWith('.') || !source.endsWith('.js')) {
        return null;
      }
      const candidate = path.resolve(path.dirname(importer), `${source.slice(0, -3)}.ts`);
      return fs.existsSync(candidate) ? candidate : null;
    },
  };
}

/** Map workspace packages to their TS source entry (run tests against source). */
export const workspaceAlias: Record<string, string> = {
  '@sajawat/shared': path.join(repoRoot, 'packages/shared/src/index.ts'),
  '@sajawat/types': path.join(repoRoot, 'packages/types/src/index.ts'),
  '@sajawat/ui': path.join(repoRoot, 'packages/ui/src/index.ts'),
};

/** Coverage defaults; packages narrow `include` to their own `src`. */
export const coverageDefaults = {
  provider: 'v8' as const,
  reporter: ['text', 'lcov', 'html'] as const,
  reportsDirectory: './coverage',
  exclude: [
    '**/dist/**',
    '**/.next/**',
    '**/test/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.config.*',
    '**/*.d.ts',
    '**/index.ts',
  ],
};
