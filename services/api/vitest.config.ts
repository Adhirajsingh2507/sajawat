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
      // Operational CLI scripts (one-shot seeders/index sync) carry no assertions
      // worth gating — excluded like `index.ts`.
      exclude: [...coverageDefaults.exclude, 'src/scripts/**'],
      // Coverage ratchet (1.10b.2). Floors are set a few points UNDER the
      // measured levels — a regression net, not a cliff — and ratchet up as
      // coverage rises. Per-module floors lock in the revenue + security path;
      // the global floor stops new code from diluting the whole. Dormant /
      // secondary code (payments, whatsapp-provider, collection, promotion) is
      // covered only by the global floor until its own milestone tests land.
      thresholds: {
        statements: 74,
        branches: 58,
        functions: 76,
        lines: 76,
        'src/auth/**/*.ts': { statements: 80, functions: 90, lines: 80 },
        'src/errors/**/*.ts': { statements: 85, lines: 85 },
        'src/middleware/**/*.ts': { statements: 78, lines: 80 },
        'src/modules/auth/**/*.ts': { statements: 82, lines: 84 },
        'src/modules/cart/**/*.ts': { statements: 85, lines: 87 },
        'src/modules/category/**/*.ts': { statements: 86, lines: 88 },
        'src/modules/crm/**/*.ts': { statements: 90, lines: 90 },
        'src/modules/inventory/**/*.ts': { statements: 80, lines: 82 },
        'src/modules/order/**/*.ts': { statements: 75, lines: 78 },
        'src/modules/session/**/*.ts': { statements: 88, lines: 88 },
        'src/modules/settings/**/*.ts': { statements: 92, lines: 95 },
        'src/modules/wishlist/**/*.ts': { statements: 88, lines: 90 },
      },
    },
  },
});
