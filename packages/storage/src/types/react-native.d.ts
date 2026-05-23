/**
 * Local type stub for `react-native`. Replaced by the real package once
 * Expo lands in apps/app (PR #6). Keeps this package typecheckable in
 * isolation without pulling RN as a hard dependency.
 */
declare module "react-native" {
  export const Platform: {
    OS: "ios" | "android" | "web" | "windows" | "macos";
    select<T>(spec: Partial<Record<"ios" | "android" | "web" | "default", T>>): T | undefined;
  };
}
