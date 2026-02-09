import { defineConfig, devices } from '@playwright/test';

/**
 * ObjectOS E2E smoke tests — Playwright configuration.
 *
 * Runs against the Vite dev server (port 5321) which proxies
 * /api/v1 to the ObjectStack Hono server (port 5320).
 *
 * Usage:
 *   pnpm e2e           # headless
 *   pnpm e2e --ui      # interactive UI mode
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:5321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start Vite dev server before running tests */
  webServer: {
    command: 'pnpm web:dev',
    port: 5321,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
