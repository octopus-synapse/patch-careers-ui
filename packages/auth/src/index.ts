/**
 * Public entrypoint for `@patch-careers/auth`.
 *
 * Surface:
 *   - `configureAuthClient` / `resetAuthClient` — one-time host wiring
 *   - `login` / `verifyTwoFactor` / `logout` / `refresh` / `bootstrap`
 *   - `useAuthStore` + selectors — observable auth state for React
 *   - `createTokenStorage` — escape hatch for tests or alternative
 *      persistence layers
 *   - OAuth helpers via the `./oauth` subpath
 */
export * from "./auth.store";
export * from "./client";
export * from "./refresh-queue";
export * from "./token-storage";
export * from "./types";
