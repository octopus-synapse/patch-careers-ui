import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PATCH_CAREERS_E2E_PORT ?? 8082);

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `pnpm --filter client web -- --port ${PORT} --clear`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
