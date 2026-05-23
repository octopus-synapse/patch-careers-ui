/**
 * Tamagui config bridge that maps `@patch-careers/tokens` to the shape
 * expected by `createTamagui`. We deliberately keep this thin — the
 * source of truth for design lives in the tokens package (PR #4); this
 * file only wires it into Tamagui's tokens/themes/fonts contract.
 *
 * PR #6: just enough for a working Provider + StatusBar/theming.
 * PR #8 (`@patch-careers/ui`) will add primitives that consume these.
 */

import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  palette,
  radius,
  spacing,
  themeDark,
  themeLight,
} from "@patch-careers/tokens";
import { createTamagui } from "@tamagui/core";

const space = {
  $0: spacing[0],
  $1: spacing[1],
  $2: spacing[2],
  $3: spacing[3],
  $4: spacing[4],
  $5: spacing[5],
  $6: spacing[6],
  $8: spacing[8],
  $10: spacing[10],
  $12: spacing[12],
  $16: spacing[16],
  $20: spacing[20],
  $24: spacing[24],
  true: spacing[4],
} as const;

const size = space;

const radiusTokens = {
  $none: radius.none,
  $sm: radius.sm,
  $md: radius.md,
  $lg: radius.lg,
  $xl: radius.xl,
  $2xl: radius["2xl"],
  $full: radius.full,
  true: radius.md,
} as const;

// Build a flat color token map: every palette ramp + every theme token.
// Names mirror `intent.<kind>.<variant>.<token>` so themes can reference
// `$accentBg`, `$dangerFg`, etc. directly.
const zIndex = {
  $0: 0,
  $1: 100,
  $2: 200,
  $3: 300,
  $4: 400,
  $5: 500,
} as const;

const colorTokens = {
  // raw palette (rare direct use, mostly for shadows/overlays)
  $gray50: palette.gray[50],
  $gray100: palette.gray[100],
  $gray200: palette.gray[200],
  $gray300: palette.gray[300],
  $gray400: palette.gray[400],
  $gray500: palette.gray[500],
  $gray600: palette.gray[600],
  $gray700: palette.gray[700],
  $gray800: palette.gray[800],
  $gray900: palette.gray[900],
  $blue500: palette.blue[500],
  $blue600: palette.blue[600],
  $red500: palette.red[500],
  $red600: palette.red[600],
  $green500: palette.green[500],
  $green600: palette.green[600],

  // semantic — light variants (themes override these for dark)
  $neutralBg: themeLight.colors.neutral.bg,
  $neutralFg: themeLight.colors.neutral.fg,
  $accentBg: themeLight.colors.accent.bg,
  $accentFg: themeLight.colors.accent.fg,
  $dangerBg: themeLight.colors.danger.bg,
  $dangerFg: themeLight.colors.danger.fg,
  $successBg: themeLight.colors.success.bg,
  $successFg: themeLight.colors.success.fg,

  // surface helpers
  $background: themeLight.colors.neutral.subtleBg,
  $foreground: themeLight.colors.neutral.fg,
  $border: themeLight.colors.neutral.border,
} as const;

const tokens = {
  size,
  space,
  radius: radiusTokens,
  zIndex,
  color: colorTokens,
} as const;

const fonts = {
  body: {
    family: fontFamily.body,
    size: fontSize,
    lineHeight,
    weight: fontWeight,
    letterSpacing,
  },
  heading: {
    family: fontFamily.heading,
    size: fontSize,
    lineHeight,
    weight: fontWeight,
    letterSpacing,
  },
  mono: {
    family: fontFamily.mono,
    size: fontSize,
    lineHeight,
    weight: fontWeight,
    letterSpacing,
  },
};

// Tamagui themes are flat name→color maps. We expose the same semantic
// names from `colorTokens` but with values swapped between light/dark.
const themes = {
  light: {
    background: themeLight.colors.neutral.subtleBg,
    foreground: themeLight.colors.neutral.fg,
    border: themeLight.colors.neutral.border,
    accentBg: themeLight.colors.accent.bg,
    accentFg: themeLight.colors.accent.fg,
    dangerBg: themeLight.colors.danger.bg,
    dangerFg: themeLight.colors.danger.fg,
    successBg: themeLight.colors.success.bg,
    successFg: themeLight.colors.success.fg,
    neutralBg: themeLight.colors.neutral.bg,
    neutralFg: themeLight.colors.neutral.fg,
  },
  dark: {
    background: themeDark.colors.neutral.subtleBg,
    foreground: themeDark.colors.neutral.fg,
    border: themeDark.colors.neutral.border,
    accentBg: themeDark.colors.accent.bg,
    accentFg: themeDark.colors.accent.fg,
    dangerBg: themeDark.colors.danger.bg,
    dangerFg: themeDark.colors.danger.fg,
    successBg: themeDark.colors.success.bg,
    successFg: themeDark.colors.success.fg,
    neutralBg: themeDark.colors.neutral.bg,
    neutralFg: themeDark.colors.neutral.fg,
  },
} as const;

export const config = createTamagui({
  tokens,
  themes,
  fonts,
  shorthands: {},
  defaultTheme: "light",
  defaultFont: "body",
});

export type AppTamaguiConfig = typeof config;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default config;
