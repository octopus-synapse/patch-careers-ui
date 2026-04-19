import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  globalSetup: './test/infrastructure/e2e/global-setup.ts',
  webServer: {
    command: 'bun run dev',
    port: 5173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
