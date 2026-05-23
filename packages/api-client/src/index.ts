/**
 * Public entrypoint for `@patch-careers/api-client`.
 *
 * Three planes ship from this package:
 *
 *   - `client/`     manual fetcher + auth interceptor surface. The
 *                   `fetcher` default-export is what every Kubb hook
 *                   imports under the hood; host apps configure it once
 *                   via `configureApiClient({ baseURL, getAuthHeader,
 *                   refreshAuth })` (typically inside
 *                   `@patch-careers/auth.bootstrap()`).
 *   - `generated/`  Kubb output: `ts/` (DTOs), `zod/` (schemas), `hooks/`
 *                   (React Query hooks). Re-run `pnpm sdk:generate` to
 *                   refresh after the backend ships a swagger change.
 *   - `generated/{dictionaries,enums,error-codes}.ts`  emitted by
 *                   `scripts/post-kubb.ts` from the JSON artefacts the
 *                   backend exports alongside the swagger.
 *
 * Subpath exports (`./dictionaries`, `./enums`, `./error-codes`,
 * `./client`) are kept for callers that want to import a single concern
 * without pulling the whole barrel.
 */

export * from "./client/fetcher";
// Kubb-generated barrel: hooks + ts DTOs + zod schemas, grouped by tag.
// Sourced from `src/generated/index.ts` (2k+ exports — `pnpm sdk:generate`
// keeps it in sync with profile-services).
export * from "./generated";
export * from "./generated/dictionaries";
export * from "./generated/enums";
export * from "./generated/error-codes";
