/**
 * FrostedPill — the rounded-full frosted-glass capsule shared by the Jobs
 * scope tabs ("Todas · Salvas · Candidaturas") AND the active filter chips, so
 * the two render the EXACT same material (DRY). Active = bright frosted glass
 * (light tint + near-white wash) with dark ink text; inactive = deep
 * translucent glass with light text. The active pill also lifts on a stronger
 * shadow. This mirror holds in both themes — the active pill always reads
 * lighter.
 *
 * Icon-agnostic by design: leading/trailing glyphs are render-props that
 * receive the resolved per-state text color, so callers (which own the icon
 * set, e.g. Ionicons) can tint their glyphs to match without this package
 * depending on any icon library. `onPress` is optional — omit it for a static
 * pill (e.g. a read-only badge or the collapsed-header search surface).
 *
 * Caveat: expo-blur is a different engine than CSS `backdrop-filter`, so the
 * frost can't be pixel-identical to a browser demo — the surface color is
 * driven by the wash with the blur kept light, to land as close as possible.
 */
import { BlurView } from "expo-blur";
import type { ReactElement, ReactNode } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { editorialFonts as fonts } from "./fonts";

/**
 * Resolved per-state appearance of the frosted pill, exported so callers can
 * match bespoke surfaces (e.g. the collapsed-header search input) and tint
 * their own glyphs to the same ink/light text color.
 */
export const FROSTED_PILL_STATE = {
  active: {
    tint: "light" as const,
    intensity: 50,
    wash: "rgba(255,255,255,0.82)",
    border: "rgba(255,255,255,0.9)",
    text: "#0A0A0A",
  },
  inactive: {
    tint: "dark" as const,
    intensity: 30,
    wash: "rgba(20,20,22,0.42)",
    border: "rgba(255,255,255,0.14)",
    text: "rgba(255,255,255,0.92)",
  },
} as const;

/** Per-size metrics. `sm` sits halfway between the full `md` pill and a tight
 * one — a compact-but-legible row for the scope tabs / active filter chips. */
const SIZES = {
  md: { height: 40, paddingHorizontal: 18, gap: 8, fontSize: 14, icon: 17 },
  sm: { height: 32, paddingHorizontal: 14, gap: 6, fontSize: 11, icon: 14 },
} as const;
export type FrostedPillSize = keyof typeof SIZES;

export interface FrostedPillProps {
  label: string;
  active: boolean;
  /**
   * Leading glyph; receives the resolved text color AND the size-appropriate
   * icon size so it matches the state and the pill's `size`.
   */
  renderLeading?: (color: string, iconSize: number) => ReactNode;
  /** Trailing glyph (e.g. an × on removable chips); receives color + icon size. */
  renderTrailing?: (color: string, iconSize: number) => ReactNode;
  /** Omit for a static (non-interactive) pill. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** a11y selected state; defaults to `active`. */
  selected?: boolean;
  /** Pill density. Defaults to `md`. */
  size?: FrostedPillSize;
  style?: StyleProp<ViewStyle>;
}

export function FrostedPill({
  label,
  active,
  renderLeading,
  renderTrailing,
  onPress,
  accessibilityLabel,
  selected,
  size = "md",
  style,
}: FrostedPillProps): ReactElement {
  const p = active ? FROSTED_PILL_STATE.active : FROSTED_PILL_STATE.inactive;
  const s = SIZES[size];
  const pillStyle = {
    height: s.height,
    paddingHorizontal: s.paddingHorizontal,
    gap: s.gap,
  };
  const inner = (
    <>
      <View style={[styles.clip, { borderColor: p.border }]}>
        <BlurView tint={p.tint} intensity={p.intensity} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: p.wash }]} />
      </View>
      {renderLeading?.(p.text, s.icon)}
      <Text style={[styles.label, { color: p.text, fontSize: s.fontSize }]} numberOfLines={1}>
        {label}
      </Text>
      {renderTrailing?.(p.text, s.icon)}
    </>
  );

  // Wrapper carries the (unclipped) drop shadow so the pill rounding doesn't
  // clip it; the active pill lifts higher.
  return (
    <View style={[styles.wrap, active && styles.wrapActive, style]}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: selected ?? active }}
          accessibilityLabel={accessibilityLabel ?? label}
          onPress={onPress}
          style={({ pressed }) => [styles.pill, pillStyle, pressed && styles.pressed]}
        >
          {inner}
        </Pressable>
      ) : (
        <View style={[styles.pill, pillStyle]}>{inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 999,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.18)",
  },
  wrapActive: {
    boxShadow: "0px 6px 14px rgba(0,0,0,0.22)",
  },
  // height / paddingHorizontal / gap come from the `size` variant (inline).
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  pressed: { opacity: 0.7 },
  // Clipped frosted surface + hairline border, kept separate from the wrapper
  // so the wrapper's shadow isn't clipped by the pill rounding.
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  // fontSize comes from the `size` variant (inline).
  label: {
    fontFamily: fonts.sans,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
