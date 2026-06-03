/**
 * Runtime detection shared across leaf packages.
 *
 * React Native (Hermes) exposes a `navigator.product === "ReactNative"`
 * sentinel. We also honour an explicit `PATCH_CAREERS_NATIVE=1` env
 * override so tests and web-first builds can force native mode.
 *
 * Centralised here so the sentinel string and its caveat live in exactly
 * one place — consumed by the api-client fetcher (`isNative` header
 * injection) and the storage adapter dispatcher.
 */
export function isReactNativeRuntime(): boolean {
  if (typeof process !== "undefined" && process.env?.PATCH_CAREERS_NATIVE === "1") {
    return true;
  }
  const nav = (globalThis as { navigator?: { product?: string } }).navigator;
  return nav?.product === "ReactNative";
}

/** Convenience inverse — true on web / non-React-Native runtimes. */
export function isWebRuntime(): boolean {
  return !isReactNativeRuntime();
}
