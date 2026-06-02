import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { nodeNextTsResolver, workspaceAlias, coverageDefaults } from '@sajawat/config/vitest/base';

export default defineConfig({
  plugins: [react(), nodeNextTsResolver()],
  resolve: { alias: workspaceAlias },
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
