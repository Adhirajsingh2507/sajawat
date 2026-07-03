import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { nodeNextTsResolver, workspaceAlias, coverageDefaults } from '@sajawat/config/vitest/base';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react(), nodeNextTsResolver()],
  // `@/` mirrors the tsconfig path alias so tests import app modules the same way.
  resolve: { alias: { '@': srcDir, ...workspaceAlias } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      ...coverageDefaults,
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});
