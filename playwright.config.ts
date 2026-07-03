import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E (0.9 smoke + 1.10a business journeys).
 *
 * - Smoke (`smoke.spec.ts`): web-only, runs everywhere (incl. CI).
 * - Journeys (`customer-journey.spec.ts`): real web + API + Mongo flows, gated on
 *   `E2E_FULL_STACK=1`; `global-setup.ts` seeds a deterministic in-stock product.
 *
 * Default: build+start the web app locally. Set PLAYWRIGHT_BASE_URL to target an
 * already-running stack — required for the full-stack journeys (both web + API
 * must be up; `next start` can't serve the standalone build, so point at a dev
 * or standalone server).
 */
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  // No-op unless E2E_FULL_STACK=1 (then it seeds via the admin API).
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: externalBaseURL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'pnpm --filter @sajawat/web start',
        url: 'http://localhost:3000/health',
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
});
