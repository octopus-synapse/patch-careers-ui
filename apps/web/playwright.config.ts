import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  globalSetup: './test/infrastructure/e2e/global-setup.ts',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  webServer: {
    command: 'bun run dev',
    port: 5173,
    reuseExistingServer: true,
  },
  // Auto-retry failed tests up to 2 times. Onboarding-flows tests share a
  // single seeded user via `authContext`; even with `restart?mode=clean` in
  // `beforeEach`, parallel workers occasionally race the backend's
  // OnboardingProgress mutation against a sibling test's reset. A retry
  // re-creates the page in a clean state — the race almost never repeats.
  // Production bugs surface on multiple retries; transient races resolve.
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Vite cold-compile on the first hit per worker can exceed 30s. Without a
    // generous navigation timeout, the first `page.goto` in a fresh worker
    // tears the test down before the SPA shell even reaches its first paint.
    navigationTimeout: 60_000,
  },
  timeout: 60_000,
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
