import { defineConfig } from 'vitest/config';
import { nodeNextTsResolver, workspaceAlias, coverageDefaults } from '@sajawat/config/vitest/base';

export default defineConfig({
  plugins: [nodeNextTsResolver()],
  resolve: { alias: workspaceAlias },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      ...coverageDefaults,
      include: ['src/**/*.ts'],
      thresholds: {
        'src/auth/**/*.ts': { statements: 90, functions: 100, lines: 90 },
      },
    },
  },
});
