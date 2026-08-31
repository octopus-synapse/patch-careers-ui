/**
 * Theme-resolved landing art palettes — one hook per token family, all
 * one-liners over `landing*Palettes[useThemeName()]`. The landing follows
 * the app scheme, so components must never import the static light-only
 * consts (`landingAccents`, `landingScoreRamp`, …) directly.
 */

import {
  type LandingAccent,
  type LandingAccentKey,
  type LandingBrandFacePalette,
  type LandingMascotLegPalette,
  type LandingRobotPalette,
  type LandingScoreBand,
  type LandingScoreColor,
  landingAccentPalettes,
  landingBrandFacePalettes,
  landingMascotLegsPalettes,
  landingRobotPalettes,
  landingScoreRampPalettes,
} from "@patch-careers/tokens";
import { useThemeName } from "@patch-careers/ui";

export function useLandingAccents(): Record<LandingAccentKey, LandingAccent> {
  return landingAccentPalettes[useThemeName()];
}

export function useLandingScoreRamp(): Record<LandingScoreBand, LandingScoreColor> {
  return landingScoreRampPalettes[useThemeName()];
}

export function useLandingRobot(): LandingRobotPalette {
  return landingRobotPalettes[useThemeName()];
}

export function useLandingBrandFace(): LandingBrandFacePalette {
  return landingBrandFacePalettes[useThemeName()];
}

export function useLandingMascotLegs(): Record<"left" | "right", LandingMascotLegPalette> {
  return landingMascotLegsPalettes[useThemeName()];
}
