/**
 * `useEditorialPalette` — the editorial palette matching the active Tamagui
 * theme. The replacement for importing the light-only `editorialPalette`
 * constant directly: same shape, flips with dark mode.
 */

import type { EditorialPalette } from "@patch-careers/tokens";
import { editorialPaletteFor } from "./editorial-palette";
import { useThemeName } from "./use-theme-name";

export function useEditorialPalette(): EditorialPalette {
  return editorialPaletteFor(useThemeName());
}
