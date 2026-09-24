/**
 * Shared frosted tab-bar primitives — the "glyph over a small-caps label on a
 * blurred translucent surface" material, factored out so the bottom navigation
 * bar (EditorialTabBar) and in-screen scope tabs (e.g. Jobs "Todas | Salvas")
 * share the same material. iOS/WhatsApp-style frosted glass via expo-blur,
 * with a theme wash on top so the editorial color still reads over whatever
 * shows through. Active = ink + (caller-chosen) filled glyph; inactive = muted.
 *
 * `FrostedBar` is the surface (blur + wash); the caller owns positioning and
 * borders via `style`. `TabBarItem` is one column. Layout is uniform by
 * construction: every item is `flex: 1` and its glyph sits in a fixed-height
 * band, so a taller glyph (e.g. an avatar) never makes its column taller —
 * labels stay on one baseline.
 */
import {
  editorialGlass,
  editorialPalette,
  editorialPaletteDark,
  type FrostedVariant,
} from "@patch-careers/tokens";
import { BlurView } from "expo-blur";
import type { ReactElement, ReactNode } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

/** Default glyph size (the `compact` size); kept for back-compat imports. */
export const TAB_ICON_SIZE = 22;
export const TAB_ICON_BAND = 26;

// Per-size metrics. `compact` = the dense bottom nav bar; `comfortable` = a
// roomier in-screen bar (bigger glyph, more breathing room around the column).
const SIZES = {
  compact: { icon: 22, band: 26, paddingTop: 8, paddingBottom: 6, gap: 4 },
  comfortable: { icon: 25, band: 30, paddingTop: 15, paddingBottom: 13, gap: 7 },
} as const;
export type TabBarItemSize = keyof typeof SIZES;
export type TabBarItemPresentation = "standard" | "mobileNavigation";

/**
 * The frosted material on its own: the blur and its wash, both filling the
 * host. Use it directly when you need the surface inside a container you
 * already own — an animated drawer panel, say — and `FrostedBar`'s wrapper
 * would get in the way. Render it as the FIRST child so content paints on top;
 * the host must establish a containing block and clip its overflow.
 */
export function FrostedFill({ variant = "thin" }: { variant?: FrostedVariant }): ReactElement {
  const material = editorialGlass[useThemeName()][variant];
  return (
    <>
      <BlurView
        tint={material.tint}
        intensity={material.intensity}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: material.wash }]}
      />
    </>
  );
}

/**
 * The frosted translucent surface: `FrostedFill` behind `children`.
 * Positioning, rounding and borders are the caller's job (passed via `style`)
 * since the bottom bar floats edge-to-edge while in-screen bars are rounded
 * and/or pinned. `variant="glass"` is the most translucent — use it when real
 * content scrolls behind so the blur actually reads.
 */
export function FrostedBar({
  children,
  style,
  onLayout,
  variant = "thin",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
  variant?: FrostedVariant;
}): ReactElement {
  return (
    <View style={[surface.bar, style]} onLayout={onLayout}>
      <FrostedFill variant={variant} />
      {children}
    </View>
  );
}

/**
 * One tab column: a glyph in the fixed band over a small-caps label. The glyph
 * receives the resolved per-state `color` (+ `focused`) so the caller can swap
 * outline/filled. `badge` anchors to the glyph's corner (e.g. unread count).
 */
export function TabBarItem({
  label,
  focused,
  onPress,
  renderIcon,
  badge,
  accessibilityLabel,
  size = "compact",
  presentation = "standard",
  showActiveIndicator = true,
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  renderIcon: (args: { focused: boolean; color: string; size: number }) => ReactNode;
  badge?: ReactNode;
  accessibilityLabel?: string;
  size?: TabBarItemSize;
  /** Compact mobile dock: active glyph gets the brand fill and drops its label. */
  presentation?: TabBarItemPresentation;
  /** Disable when the parent renders one shared sliding selection indicator. */
  showActiveIndicator?: boolean;
}): ReactElement {
  const theme = useThemeName();
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const isMobileNavigation = presentation === "mobileNavigation";
  const color = focused
    ? isMobileNavigation
      ? palette.onPrimary
      : palette.ink
    : isMobileNavigation
      ? palette.ink
      : palette.muted;
  const labelColor = isMobileNavigation ? palette.muted : color;
  const iconSize = isMobileNavigation ? (focused ? 24 : 20) : SIZES[size].icon;
  const styles = stylesBySize[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        isMobileNavigation && navigationStyles.tab,
        pressed && press.tab,
      ]}
    >
      <View
        style={[
          styles.iconBand,
          isMobileNavigation && navigationStyles.iconBand,
          isMobileNavigation && focused && showActiveIndicator && navigationStyles.activeIndicator,
          isMobileNavigation &&
            focused &&
            showActiveIndicator && { backgroundColor: palette.primary },
        ]}
      >
        {/* Tight wrapper so the badge anchors to the glyph's corner. */}
        <View style={press.glyph}>
          {renderIcon({ focused, color, size: iconSize })}
          {badge}
        </View>
      </View>
      {!isMobileNavigation || !focused ? (
        <Text
          style={[
            styles.label,
            isMobileNavigation && navigationStyles.label,
            { color: labelColor },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const surface = StyleSheet.create({
  // Transparent so the BlurView + wash show through; overflow clips the blur.
  bar: { backgroundColor: "transparent", overflow: "hidden" },
});

const press = StyleSheet.create({
  // Press feedback via opacity only — no scale, so tabs never resize.
  tab: { opacity: 0.55 },
  // Containing block for the absolutely-positioned badge.
  glyph: { position: "relative" },
});

const navigationStyles = StyleSheet.create({
  tab: {
    paddingTop: 2,
    paddingBottom: 2,
    gap: 3,
  },
  activeIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconBand: { height: 24 },
  label: {
    fontFamily: fonts.navigation,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: -0.1,
    textTransform: "none",
  },
});

const sizeStyles = (s: (typeof SIZES)[TabBarItemSize]) =>
  StyleSheet.create({
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      gap: s.gap,
    },
    // Fixed-height band every tab shares → uniform columns, aligned labels.
    iconBand: { height: s.band, alignItems: "center", justifyContent: "center" },
    label: {
      fontFamily: fonts.sans,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontWeight: "600",
    },
  });

const stylesBySize = {
  compact: sizeStyles(SIZES.compact),
  comfortable: sizeStyles(SIZES.comfortable),
} as const;
