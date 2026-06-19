/**
 * Shared frosted tab-bar primitives — the "glyph over a small-caps label on a
 * blurred translucent surface" material, factored out so the bottom navigation
 * bar (EditorialTabBar) and in-screen scope tabs (e.g. Jobs "Todas | Salvas")
 * render the EXACT same thing. iOS/WhatsApp-style frosted glass via expo-blur,
 * with a theme wash on top so the editorial color still reads over whatever
 * shows through. Active = ink + (caller-chosen) filled glyph; inactive = muted.
 *
 * `FrostedBar` is the surface (blur + wash); the caller owns positioning and
 * borders via `style`. `TabBarItem` is one column. Layout is uniform by
 * construction: every item is `flex: 1` and its glyph sits in a fixed-height
 * band, so a taller glyph (e.g. an avatar) never makes its column taller —
 * labels stay on one baseline.
 */
import { editorialPalette, editorialPaletteDark } from "@patch-careers/tokens";
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

// Blur tint + intensity + a translucent surface wash, keyed by theme. Variants:
//   • `thin`  — faint veil; leans on content scrolling behind it (bottom bar).
//   • `panel` — near-opaque surface tone; a self-contained card on a flat bg.
//   • `glass` — very translucent + strong blur, so live content scrolling
//     behind reads clearly as frosted glass (the pinned Jobs scope bar).
const BLUR = {
  light: {
    tint: "light",
    intensity: { thin: 60, panel: 60, glass: 95 },
    wash: {
      thin: "rgba(255,255,255,0.45)",
      panel: "rgba(255,255,255,0.72)",
      glass: "rgba(250,249,245,0.3)",
    },
  },
  dark: {
    tint: "dark",
    intensity: { thin: 50, panel: 50, glass: 85 },
    wash: {
      thin: "rgba(30,29,25,0.4)",
      panel: "rgba(38,36,31,0.72)",
      glass: "rgba(24,23,20,0.26)",
    },
  },
} as const;

/** Which wash/intensity to lay over the blur — see `BLUR`. Default `"thin"`. */
export type FrostedBarVariant = "thin" | "panel" | "glass";

/**
 * The frosted translucent surface: a BlurView + theme wash behind `children`.
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
  variant?: FrostedBarVariant;
}): ReactElement {
  const theme = useThemeName();
  const blur = BLUR[theme];
  return (
    <View style={[surface.bar, style]} onLayout={onLayout}>
      <BlurView
        tint={blur.tint}
        intensity={blur.intensity[variant]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: blur.wash[variant] }]} />
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
}: {
  label: string;
  focused: boolean;
  onPress: () => void;
  renderIcon: (args: { focused: boolean; color: string; size: number }) => ReactNode;
  badge?: ReactNode;
  accessibilityLabel?: string;
  size?: TabBarItemSize;
}): ReactElement {
  const theme = useThemeName();
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const color = focused ? palette.ink : palette.muted;
  const styles = stylesBySize[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && press.tab]}
    >
      <View style={styles.iconBand}>
        {/* Tight wrapper so the badge anchors to the glyph's corner. */}
        <View style={press.glyph}>
          {renderIcon({ focused, color, size: SIZES[size].icon })}
          {badge}
        </View>
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
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
