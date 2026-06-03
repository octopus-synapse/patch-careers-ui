/**
 * `<Icon>` — Tamagui-flavored wrapper around `lucide-react-native`.
 *
 * Maps `size` token names ("sm"|"md"|"lg") to pixel sizes and pulls
 * stroke color from the active theme token by default. Consumers pass
 * any Lucide icon component as the `as` prop.
 */

import type { ComponentType } from "react";
import { useTheme } from "tamagui";
import { readThemeValue } from "../internal/theme-value";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_TO_PX: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export type LucideIconLike = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type IconProps = {
  as: LucideIconLike;
  size?: IconSize | number;
  color?: string;
  strokeWidth?: number;
  accessibilityLabel?: string;
};

export function Icon({
  as: Component,
  size = "md",
  color,
  strokeWidth = 2,
  accessibilityLabel,
}: IconProps) {
  const theme = useTheme();
  const px = typeof size === "number" ? size : SIZE_TO_PX[size];
  const resolvedColor = color ?? readThemeValue(theme.color) ?? "currentColor";
  const a11yProps = accessibilityLabel
    ? { "aria-label": accessibilityLabel }
    : { "aria-hidden": true };
  return <Component size={px} color={resolvedColor} strokeWidth={strokeWidth} {...a11yProps} />;
}
