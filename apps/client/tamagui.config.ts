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
  editorialPalette,
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
import { createAnimations } from "@tamagui/animations-react-native";
import { createTamagui } from "@tamagui/core";
import { Platform } from "react-native";

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

  // editorial palette — global tokens so `@patch-careers/ui/editorial`
  // components resolve them regardless of the active theme (the `editorial`
  // theme below only flips surface/text defaults). Light-only by design.
  $paper: editorialPalette.bg,
  $surface: editorialPalette.surface,
  $ink: editorialPalette.ink,
  $inkBody: editorialPalette.body,
  $inkMuted: editorialPalette.muted,
  $inkSubtle: editorialPalette.subtle,
  $hairline: editorialPalette.hairline,
  $hairlineStrong: editorialPalette.hairlineStrong,
  $accentBlue: editorialPalette.accent,
  $accentDeep: editorialPalette.accentDeep,
  $primaryInk: editorialPalette.primary,
  $primaryInkPress: editorialPalette.primaryPress,
  $editorialDanger: editorialPalette.danger,
  $editorialSuccess: editorialPalette.success,
  $editorialWarn: editorialPalette.warn,
  $editorialFair: editorialPalette.fair,
} as const;

const tokens = {
  size,
  space,
  radius: radiusTokens,
  zIndex,
  color: colorTokens,
} as const;

// Tamagui internamente acessa fontSize via $1..$16 (key numérica). Nosso
// tokens são nomeados semânticos (xs/sm/md/...). Mapeio AMBOS pro mesmo
// valor — semânticos pra uso explícito (`$md`), numerados pra Tamagui
// internal defaults (`$4`).
const fontSizeMap = {
  // Semânticos (uso explícito no app)
  xs: fontSize.xs,
  sm: fontSize.sm,
  md: fontSize.md,
  lg: fontSize.lg,
  xl: fontSize.xl,
  "2xl": fontSize["2xl"],
  "3xl": fontSize["3xl"],
  "4xl": fontSize["4xl"],
  "5xl": fontSize["5xl"],
  "6xl": fontSize["6xl"],
  // Numerados (Tamagui defaults — $1 = menor, $10 = maior)
  1: fontSize.xs,
  2: fontSize.sm,
  3: fontSize.md,
  4: fontSize.lg,
  5: fontSize.xl,
  6: fontSize["2xl"],
  7: fontSize["3xl"],
  8: fontSize["4xl"],
  9: fontSize["5xl"],
  10: fontSize["6xl"],
  // True (Tamagui usa $true como default)
  true: fontSize.md,
} as const;

const lineHeightMap = {
  xs: lineHeight.xs,
  sm: lineHeight.sm,
  md: lineHeight.md,
  lg: lineHeight.lg,
  xl: lineHeight.xl,
  "2xl": lineHeight["2xl"],
  "3xl": lineHeight["3xl"],
  "4xl": lineHeight["4xl"],
  "5xl": lineHeight["5xl"],
  "6xl": lineHeight["6xl"],
  1: lineHeight.xs,
  2: lineHeight.sm,
  3: lineHeight.md,
  4: lineHeight.lg,
  5: lineHeight.xl,
  6: lineHeight["2xl"],
  7: lineHeight["3xl"],
  8: lineHeight["4xl"],
  9: lineHeight["5xl"],
  10: lineHeight["6xl"],
  true: lineHeight.md,
} as const;

// Editorial serif stack — Georgia on iOS/web, platform serif on Android.
// Registered as a Tamagui font family string (no expo-font / bundled file);
// italic is a separate `fontStyle="italic"` prop, not a distinct family.
const serifFamily = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});

const fonts = {
  body: {
    family: fontFamily.body,
    size: fontSizeMap,
    lineHeight: lineHeightMap,
    weight: fontWeight,
    letterSpacing,
  },
  heading: {
    family: fontFamily.heading,
    size: fontSizeMap,
    lineHeight: lineHeightMap,
    weight: fontWeight,
    letterSpacing,
  },
  mono: {
    family: fontFamily.mono,
    size: fontSizeMap,
    lineHeight: lineHeightMap,
    weight: fontWeight,
    letterSpacing,
  },
  serif: {
    family: serifFamily,
    size: fontSizeMap,
    lineHeight: lineHeightMap,
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
  // Editorial Calm — light-only. Same key set as light/dark (keeps `$token`
  // typing sound); editorial-specific colors live in `tokens.color` above.
  // `theme="editorial"` flips surface/text defaults to warm paper + ink.
  editorial: {
    background: editorialPalette.bg,
    foreground: editorialPalette.ink,
    border: editorialPalette.hairline,
    accentBg: editorialPalette.accent,
    accentFg: editorialPalette.surface,
    dangerBg: editorialPalette.danger,
    dangerFg: editorialPalette.surface,
    successBg: editorialPalette.success,
    successFg: editorialPalette.surface,
    neutralBg: editorialPalette.surface,
    neutralFg: editorialPalette.ink,
  },
} as const;

// Driver de animação pra Tamagui (Toast/Sheet/etc usam internamente).
// Sem isso aparece warning "No animation driver configured" em runtime.
const animations = createAnimations({
  quick: { type: "timing", duration: 180 },
  medium: { type: "timing", duration: 320 },
  slow: { type: "timing", duration: 520 },
});

export const config = createTamagui({
  tokens,
  themes,
  fonts,
  animations,
  shorthands: {},
  defaultTheme: "light",
  defaultFont: "body",
});

export type AppTamaguiConfig = typeof config;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}

export default config;
