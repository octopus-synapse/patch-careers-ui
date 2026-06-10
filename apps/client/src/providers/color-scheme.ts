/**
 * Color-scheme preference wiring.
 *
 * The persisted store (`@patch-careers/state`, key `patch-careers:color-scheme`)
 * holds the user's choice — "light" | "dark" | "system" — picked in the
 * onboarding theme step or the profile menu. `useResolvedScheme()` collapses
 * it to the concrete theme the providers need, following the OS when the
 * choice is "system". Default is "system", so users who never chose anything
 * (including everyone onboarded before the theme step existed) follow the OS.
 */

import { type ColorScheme, createColorSchemeStore } from "@patch-careers/state";
import { mundane } from "@patch-careers/storage";
import { useColorScheme } from "react-native";

export const useColorSchemeStore = createColorSchemeStore(mundane);

export function useResolvedScheme(): "light" | "dark" {
  const scheme = useColorSchemeStore((s) => s.scheme);
  const system = useColorScheme();
  if (scheme === "system") return system === "dark" ? "dark" : "light";
  return scheme;
}

export type { ColorScheme };
