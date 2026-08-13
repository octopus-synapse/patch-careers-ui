/**
 * DEV-only feature flags read from the public Expo env.
 *
 * `isDevTestFillEnabled` gates the onboarding + sign-up "test fill" buttons.
 * Double-gated so it can never reach production:
 *  - `__DEV__` is `false` in any release build (Metro/Hermes strips the branch);
 *  - the env flag must be the explicit string `"true"`.
 * The `typeof __DEV__` guard lets this also run under Vitest (Node), where the
 * RN `__DEV__` global isn't defined.
 */
export function isDevTestFillEnabled(): boolean {
  const dev = typeof __DEV__ !== "undefined" ? __DEV__ : false;
  return dev && process.env.EXPO_PUBLIC_DEV_TEST_FILL === "true";
}

/**
 * Credentials the sign-in "test" button pre-fills. Unlike sign-up (which can
 * mint a fresh address), signing in needs an account that already exists — and
 * every machine seeds a different one, so both halves are env-overridable.
 */
export function devTestCredentials(): { email: string; password: string } {
  return {
    email: process.env.EXPO_PUBLIC_DEV_TEST_EMAIL ?? "test@example.com",
    password: process.env.EXPO_PUBLIC_DEV_TEST_PASSWORD ?? "TestPass123!",
  };
}
