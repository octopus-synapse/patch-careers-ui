/**
 * Public entrypoint for `@patch-careers/api-client`.
 *
 * The SDK is split into three planes:
 *   - `client/`     manual fetcher + auth interceptor surface (PR #5).
 *   - `generated/`  Kubb output: `ts/` (DTOs), `zod/` (schemas), `hooks/`
 *                   (React Query hooks). Re-run `pnpm sdk:generate` to
 *                   refresh after the backend ships a swagger change.
 *   - `generated/{dictionaries,enums,error-codes}.ts`  written by the
 *                   `post-kubb.ts` script from the JSON artefacts the
 *                   backend exports alongside the swagger.
 *
 * Until the first Kubb generation runs (deferred to PR #5 — needs the
 * post-PR #3 swagger merged + secret provisioning), the `./generated/*`
 * re-exports below resolve to the dictionaries-only output produced by
 * `scripts/post-kubb.ts`.
 */

export * from "./client/fetcher";
export * from "./generated/dictionaries";
export * from "./generated/enums";
export * from "./generated/error-codes";
