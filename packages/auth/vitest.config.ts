import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.test.ts",
        "src/index.ts",
        "src/types.ts",
        // OAuth helpers depend on expo-auth-session at runtime — covered via
        // app-level e2e (PR #20 Maestro) not unit, so excluded from thresholds.
        "src/oauth.ts",
      ],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
        statements: 70,
      },
    },
  },
});
