/**
 * Theme-aware editorial palette lookup.
 *
 * `editorialPaletteFor` is the pure half (unit-testable without the Tamagui
 * runtime); components call `useEditorialPalette()` which feeds it the active
 * theme from `useThemeName()`.
 */

import { type EditorialPalette, editorialPalettes } from "@patch-careers/tokens";
import type { ThemeName } from "./types";

export function editorialPaletteFor(theme: ThemeName): EditorialPalette {
  return editorialPalettes[theme];
}
