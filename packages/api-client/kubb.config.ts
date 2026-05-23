import { defineConfig } from "@kubb/core";
import { pluginOas } from "@kubb/plugin-oas";
import { pluginReactQuery } from "@kubb/plugin-react-query";
import { pluginTs } from "@kubb/plugin-ts";
import { pluginZod } from "@kubb/plugin-zod";

/**
 * Kubb codegen pipeline.
 *
 * Input: `client-swagger.json` synced from `profile-services` (the same
 * artefact `swagger:generate` emits and `_sync-contracts.yml` PRs into
 * this package's `contracts/` dir). For local development, point
 * `BACKEND_URL` at a running profile-services and pull the swagger over
 * HTTP — handy when iterating on a backend change before merging.
 *
 * Output: `src/generated/{ts,zod,hooks}` consumed by `apps/app` via the
 * package root export. The post-kubb script (`scripts/post-kubb.ts`)
 * runs after this and materialises `dictionaries.ts` / `enums.ts` /
 * `error-codes.ts` from the sibling backend artefacts.
 *
 * Decision trace: D45 (artefact format), D48 (Spectral diff already
 * gated upstream — we trust the spec here).
 */
const INPUT_PATH = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/api/client-swagger-json`
  : "./contracts/client-swagger.json";

export default defineConfig({
  root: ".",
  input: { path: INPUT_PATH },
  output: { path: "./src/generated", clean: true },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({ output: { path: "ts" }, group: { type: "tag" } }),
    pluginZod({
      output: { path: "zod" },
      group: { type: "tag" },
      typed: true,
    }),
    pluginReactQuery({
      output: { path: "hooks" },
      group: { type: "tag" },
      client: { importPath: "../../client/fetcher.ts" },
      suspense: false,
    }),
  ],
});
