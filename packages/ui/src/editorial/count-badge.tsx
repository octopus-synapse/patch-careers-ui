/**
 * Editorial count badge — a small accent pill carrying an unread/notification
 * count, meant to overlay an icon. Renders nothing when the count is zero (or
 * negative) and clamps to `"{max}+"` above the cap. Positioning is left to the
 * caller: wrap the icon in a `position: "relative"` container and let this
 * absolutely-positioned pill sit at its top-right corner. Shared by the global
 * header (messages) and the bottom tab bar (notifications).
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

export type CountBadgeProps = {
  count: number;
  /** Counts above this render as `"{max}+"`. Defaults to 99. */
  max?: number;
};

export function CountBadge({ count, max = 99 }: CountBadgeProps): ReactElement | null {
  const styles = stylesByTheme[useThemeName()];
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    badge: {
      position: "absolute",
      top: -5,
      right: -6,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      borderRadius: 8,
      backgroundColor: p.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontFamily: fonts.sans,
      color: "#FFFFFF",
      fontSize: 10,
      lineHeight: 12,
      fontWeight: "700",
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
