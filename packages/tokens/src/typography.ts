/**
 * Typography tokens — agnostic to platform font registry.
 *
 * `fontFamily` uses `"System"` as a placeholder. The Tamagui wrapper
 * (PR #6) will map these to actual font definitions loaded via
 * `expo-font` (e.g. Inter / Geist) once design lands the choice.
 *
 * `fontSize` follows a 4px-aware ramp (12,14,16,18,20,24,28,32,40,48).
 * `lineHeight` ≈ 1.4–1.5 × fontSize (rounded).
 */

export const fontFamily = {
  heading: "System",
  body: "System",
  mono: "System",
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  "5xl": 40,
  "6xl": 48,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 28,
  "2xl": 32,
  "3xl": 36,
  "4xl": 40,
  "5xl": 48,
  "6xl": 56,
} as const;

export const letterSpacing = {
  tight: -0.4,
  normal: 0,
  wide: 0.4,
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const;

export type Typography = typeof typography;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
