import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["apps/client/src/**/*.spec.ts", "apps/client/src/**/*.test.ts"],
  },
});
