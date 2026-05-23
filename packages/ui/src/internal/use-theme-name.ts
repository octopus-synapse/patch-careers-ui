/**
 * `useThemeName` — converts Tamagui's gettable `theme.name` into the
 * plain `"light"|"dark"` literal expected by token lookups.
 */

import { useTheme } from "tamagui";
import type { ThemeName } from "./types";

export function useThemeName(): ThemeName {
  const theme = useTheme();
  const raw = theme.name as unknown;
  let resolved: string | undefined;
  if (typeof raw === "string") {
    resolved = raw;
  } else if (raw && typeof (raw as { get?: () => unknown }).get === "function") {
    const value = (raw as { get: () => unknown }).get();
    resolved = typeof value === "string" ? value : undefined;
  }
  return resolved === "dark" ? "dark" : "light";
}
