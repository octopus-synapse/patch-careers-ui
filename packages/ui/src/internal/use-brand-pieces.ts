/**
 * The active theme's puzzle-piece colours — the single source every brandmark
 * and the mascot share. See `brandPiecePalettes` in @patch-careers/tokens for
 * why they must not drift.
 */

import { type BrandPiecePalette, brandPiecePalettes } from "@patch-careers/tokens";
import { useThemeName } from "./use-theme-name";

export function useBrandPieces(): BrandPiecePalette {
  return brandPiecePalettes[useThemeName()];
}
