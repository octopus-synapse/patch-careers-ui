import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/index.ts",
        "src/**/types.ts",
        // JSX wrappers + Tamagui shim + theme hook depend on the
        // Tamagui+RN runtime wired by PR #6; logic they rely on is
        // covered by `internal/*` tests separately.
        "src/primitives/**/*.tsx",
        "src/compounds/**/*.tsx",
        "src/editorial/**/*.tsx",
        "src/editorial/fonts.ts",
        "src/icons/**/*.tsx",
        "src/internal/tamagui-shim.ts",
        "src/internal/use-theme-name.ts",
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
