/**
 * Editorial count badge — a small accent pill carrying an unread/notification
 * count, meant to overlay an icon. Hides zero by default (`showZero` opts in)
 * and negative counts, and clamps to `"{max}+"` above the cap. Positioning is
 * left to the caller: wrap the icon in a `position: "relative"` container and let this
 * absolutely-positioned pill sit at its top-right corner. Shared by the global
 * header (messages) and the bottom tab bar (notifications).
 */
import {
  appNavControl,
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
  /**
   * Flip to paper-on-ink. For when the thing under the badge has itself filled
   * with a strong colour (the navbar's engaged circular controls) — an accent
   * pill on an accent fill is a smudge, so the badge inverts to stay a badge.
   */
  inverted?: boolean;
  /** Opt-in: the desktop navbar displays zero unread items explicitly. */
  showZero?: boolean;
  /** Navbar geometry and brand colors; inverted uses white with a blue count. */
  appearance?: "default" | "navbar";
};

export function CountBadge({
  count,
  max = 99,
  inverted = false,
  showZero = false,
  appearance = "default",
}: CountBadgeProps): ReactElement | null {
  const styles = stylesByTheme[useThemeName()];
  if (count < 0 || (count === 0 && !showZero)) return null;
  const label = count > max ? `${max}+` : String(count);
  const navbar = appearance === "navbar";

  return (
    <View
      style={[
        navbar ? styles.badgeNavbar : styles.badge,
        inverted && (navbar ? styles.badgeNavbarInverted : styles.badgeInverted),
      ]}
      pointerEvents="none"
      aria-hidden={navbar || undefined}
    >
      <Text
        style={[
          styles.label,
          inverted && (navbar ? styles.labelNavbarInverted : styles.labelInverted),
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const stylesFor = (p: EditorialPalette) => {
  const badge = {
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
  } as const;
  const label = {
    fontFamily: fonts.sans,
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
  } as const;

  return StyleSheet.create({
    badge,
    label,
    badgeInverted: { ...badge, backgroundColor: p.surface },
    badgeNavbar: {
      ...badge,
      top: -8,
      right: -9,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: appNavControl.onFill,
      backgroundColor: appNavControl.fill,
    },
    badgeNavbarInverted: { backgroundColor: appNavControl.onFill },
    labelNavbarInverted: { color: appNavControl.fill },
    labelInverted: { ...label, color: p.ink },
  });
};

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
