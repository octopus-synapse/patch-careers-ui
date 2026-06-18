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
