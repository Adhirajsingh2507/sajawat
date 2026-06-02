import { defineConfig } from 'vitest/config';
import { nodeNextTsResolver, workspaceAlias, coverageDefaults } from '@sajawat/config/vitest/base';

export default defineConfig({
  plugins: [nodeNextTsResolver()],
  resolve: { alias: workspaceAlias },
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      ...coverageDefaults,
      include: ['src/**/*.ts'],
      // High floors on the security-critical modules (AD-37); global stays
      // moderate (ungated) and is ratcheted up as domains land.
      thresholds: {
        'src/auth/**/*.ts': { statements: 80, functions: 90, lines: 80 },
        'src/errors/**/*.ts': { statements: 85, lines: 85 },
      },
    },
  },
});
