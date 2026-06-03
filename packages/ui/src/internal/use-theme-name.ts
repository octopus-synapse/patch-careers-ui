/**
 * `useThemeName` — converts Tamagui's gettable `theme.name` into the
 * plain `"light"|"dark"` literal expected by token lookups.
 */

import { useTheme } from "tamagui";
import { readThemeValue } from "./theme-value";
import type { ThemeName } from "./types";

export function useThemeName(): ThemeName {
  const theme = useTheme();
  return readThemeValue(theme.name) === "dark" ? "dark" : "light";
}
