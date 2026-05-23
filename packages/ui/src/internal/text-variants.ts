import { fontSize, fontWeight, lineHeight } from "@patch-careers/tokens";
/**
 * Pure variant resolver for `<Text>` typography presets.
 *
 * Maps semantic preset names ("h1", "body", etc.) to font-size /
 * line-height / weight triples from `@patch-careers/tokens`.
 */

export type TextPreset = "h1" | "h2" | "h3" | "body" | "caption" | "label" | "mono";

export type TextStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  letterSpacing: number;
};

export function resolveTextStyle(preset: TextPreset): TextStyle {
  switch (preset) {
    case "h1":
      return {
        fontSize: fontSize["4xl"],
        lineHeight: lineHeight["4xl"],
        fontWeight: fontWeight.bold,
        letterSpacing: -0.4,
      };
    case "h2":
      return {
        fontSize: fontSize["2xl"],
        lineHeight: lineHeight["2xl"],
        fontWeight: fontWeight.semibold,
        letterSpacing: -0.2,
      };
    case "h3":
      return {
        fontSize: fontSize.xl,
        lineHeight: lineHeight.xl,
        fontWeight: fontWeight.semibold,
        letterSpacing: 0,
      };
    case "body":
      return {
        fontSize: fontSize.md,
        lineHeight: lineHeight.md,
        fontWeight: fontWeight.regular,
        letterSpacing: 0,
      };
    case "caption":
      return {
        fontSize: fontSize.xs,
        lineHeight: lineHeight.xs,
        fontWeight: fontWeight.regular,
        letterSpacing: 0.2,
      };
    case "label":
      return {
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.medium,
        letterSpacing: 0,
      };
    case "mono":
      return {
        fontSize: fontSize.sm,
        lineHeight: lineHeight.sm,
        fontWeight: fontWeight.regular,
        letterSpacing: 0,
      };
  }
}
