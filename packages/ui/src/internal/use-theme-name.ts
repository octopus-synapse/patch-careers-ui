/**
 * `useThemeName` — the active Tamagui theme as the plain `"light"|"dark"`
 * literal expected by token lookups.
 *
 * Wraps Tamagui's own `useThemeName` (NOT `useTheme().name`): the official
 * hook subscribes to theme-state changes, so components re-render when the
 * user flips the scheme at runtime. Reading `.name` off `useTheme()` gives
 * the initial value but never updates — exactly the "picked dark, app stayed
 * light" failure.
 */

import { useThemeName as useTamaguiThemeName } from "@tamagui/core";
import type { ThemeName } from "./types";

export function useThemeName(): ThemeName {
  return useTamaguiThemeName() === "dark" ? "dark" : "light";
}
