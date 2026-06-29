import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirror the `@/* → src/*` alias from tsconfig (ADR-0006) so specs resolve the
// same imports the app and typecheck do.
const srcDir = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["apps/client/src/**/*.spec.ts", "apps/client/src/**/*.test.ts"],
  },
  resolve: {
    alias: [{ find: /^@\//, replacement: `${srcDir}/` }],
  },
});
