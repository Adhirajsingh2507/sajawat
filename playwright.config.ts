import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E (Milestone 0.9) — chromium-only smoke scaffold (AD-38).
 * Real customer/admin journeys arrive in Phase 1.
 *
 * Default: build+start the web app locally. Set PLAYWRIGHT_BASE_URL to target an
 * already-running stack (e.g. `docker compose up`) — the Docker-aware path.
 */
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
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
