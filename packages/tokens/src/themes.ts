/**
 * Composite themes — combine palette/intent/spacing/typography/radius/shadows
 * into `themeLight` and `themeDark`. Consumers (PR #6 Tamagui wrapper) plug
 * these into `createTamagui({ themes })`.
 */

import { intent } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export type Theme = {
  name: "light" | "dark";
  colors: {
    neutral: typeof intent.neutral.light;
    accent: typeof intent.accent.light;
    danger: typeof intent.danger.light;
    success: typeof intent.success.light;
  };
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: typeof shadows;
};

export const themeLight: Theme = {
  name: "light",
  colors: {
    neutral: intent.neutral.light,
    accent: intent.accent.light,
    danger: intent.danger.light,
    success: intent.success.light,
  },
  spacing,
  typography,
  radius,
  shadows,
};

export const themeDark: Theme = {
  name: "dark",
  colors: {
    neutral: intent.neutral.dark,
    accent: intent.accent.dark,
    danger: intent.danger.dark,
    success: intent.success.dark,
  },
  spacing,
  typography,
  radius,
  shadows,
};

export const themes = {
  light: themeLight,
  dark: themeDark,
} as const;

export type ThemeName = keyof typeof themes;
