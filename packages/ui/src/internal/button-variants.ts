/**
 * Pure variant resolver for `<Button>`.
 *
 * Maps `(variant, intent, size, themeName, state)` into style atoms that
 * the JSX wrapper feeds to Tamagui. Keeping it pure means we can unit-test
 * every cross-product without dragging Tamagui's runtime into vitest.
 */

import {
  fontSize as fontSizeTokens,
  intent as intentTokens,
  radius as radiusTokens,
  spacing as spacingTokens,
} from "@patch-careers/tokens";
import type { ButtonVariant, Intent, Size, ThemeName } from "./types";

export type ButtonState = "default" | "hover" | "press" | "disabled";

export type ButtonStyle = {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  fontSize: number;
  /** Minimum touch target height in pt — WCAG 2.5.5 (D55-D62) */
  minHeight: number;
  opacity: number;
};

const SIZE_TO_PAD_H: Record<Size, number> = {
  sm: spacingTokens[3],
  md: spacingTokens[4],
  lg: spacingTokens[5],
};

const SIZE_TO_PAD_V: Record<Size, number> = {
  sm: spacingTokens[2],
  md: spacingTokens[3],
  lg: spacingTokens[4],
};

const SIZE_TO_FONT: Record<Size, number> = {
  sm: fontSizeTokens.sm,
  md: fontSizeTokens.md,
  lg: fontSizeTokens.lg,
};

/**
 * WCAG-compliant min touch target: 44pt iOS / 48dp Android.
 * `sm` keeps 44 (button visual can be smaller but `hitSlop` should backfill).
 */
const SIZE_TO_MIN_HEIGHT: Record<Size, number> = {
  sm: 44,
  md: 48,
  lg: 56,
};

export function resolveButtonStyle(
  variant: ButtonVariant,
  intentName: Intent,
  size: Size,
  themeName: ThemeName,
  state: ButtonState = "default",
): ButtonStyle {
  const tokens = intentTokens[intentName][themeName];

  const base: ButtonStyle = {
    backgroundColor: tokens.bg,
    color: tokens.fg,
    borderColor: tokens.border,
    borderWidth: 1,
    paddingHorizontal: SIZE_TO_PAD_H[size],
    paddingVertical: SIZE_TO_PAD_V[size],
    borderRadius: radiusTokens.md,
    fontSize: SIZE_TO_FONT[size],
    minHeight: SIZE_TO_MIN_HEIGHT[size],
    opacity: 1,
  };

  if (variant === "outlined") {
    base.backgroundColor = "transparent";
    base.color = tokens.fg;
    base.borderColor = tokens.border;
  } else if (variant === "ghost") {
    base.backgroundColor = "transparent";
    base.color = tokens.fg;
    base.borderColor = "transparent";
    base.borderWidth = 0;
  }

  if (state === "hover") {
    base.backgroundColor = variant === "solid" ? tokens.hoverBg : tokens.subtleBg;
  } else if (state === "press") {
    base.backgroundColor = variant === "solid" ? tokens.pressBg : tokens.subtleBg;
  } else if (state === "disabled") {
    base.opacity = 0.5;
  }

  return base;
}
