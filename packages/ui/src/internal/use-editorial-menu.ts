/**
 * `useEditorialMenu` — the nav menu panel's own palette for the active theme.
 * Same discipline as `useEditorialPalette`: components never reach for the
 * light-only constant, so the panel follows dark mode with everything else.
 */

import { type EditorialMenuTokens, editorialMenu } from "@patch-careers/tokens";
import { useThemeName } from "./use-theme-name";

export function useEditorialMenu(): EditorialMenuTokens {
  return editorialMenu[useThemeName()];
}
