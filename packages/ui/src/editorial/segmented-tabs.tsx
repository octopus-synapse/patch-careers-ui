/**
 * Editorial segmented tab bar: small-caps segments over a full-width
 * hairline, with a 1.5px ink underline indicator that slides between
 * them (dependency-free RN Animated, same approach as ConfirmDialog).
 * Generic over the segment key — promoted from the Profile sub-tabs so
 * Jobs ("Todas | Salvas") and Profile ("Perfil | Currículos") share it.
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts as fonts } from "./fonts";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export type SegmentedTab<T extends string> = {
  key: T;
  label: string;
  /** Glyph for the `"icon"` variant; receives the resolved per-state color. */
  icon?: (color: string) => ReactNode;
};

export type SegmentedTabsProps<T extends string> = {
  tabs: ReadonlyArray<SegmentedTab<T>>;
  value: T;
  onChange: (tab: T) => void;
  /** `"label"` (default) shows text; `"icon"` shows the glyph only (IG-style). */
  variant?: "label" | "icon";
};

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = "label",
}: SegmentedTabsProps<T>): ReactElement {
  const theme = useThemeName();
  const styles = stylesByTheme[theme];
  const palette = theme === "dark" ? editorialPaletteDark : editorialPalette;
  const [width, setWidth] = useState(0);
  const index = tabs.findIndex((tab) => tab.key === value);
  const anim = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: index,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [index, anim]);

  const segment = width / tabs.length;
  const translateX = anim.interpolate({
    inputRange: [0, Math.max(1, tabs.length - 1)],
    outputRange: [0, segment * Math.max(1, tabs.length - 1)],
  });

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.row}>
        {tabs.map((tab) => {
          const selected = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(tab.key)}
              style={styles.segment}
            >
              {variant === "icon" && tab.icon ? (
                tab.icon(selected ? palette.ink : palette.muted)
              ) : (
                <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.hairline} />
      {width > 0 ? (
        <Animated.View
          style={[styles.indicator, { width: segment, transform: [{ translateX }] }]}
        />
      ) : null}
    </View>
  );
}

const stylesFor = (p: EditorialPalette) =>
  StyleSheet.create({
    root: { position: "relative" },
    row: { flexDirection: "row" },
    segment: { flex: 1, alignItems: "center", paddingVertical: 12 },
    label: {
      fontFamily: fonts.sans,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: p.muted,
    },
    labelSelected: { color: p.ink },
    hairline: { height: 1, backgroundColor: p.hairline },
    indicator: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 1.5,
      backgroundColor: p.ink,
    },
  });

// Precomputed per theme so style-object identity is stable across renders.
const stylesByTheme = {
  light: stylesFor(editorialPalette),
  dark: stylesFor(editorialPaletteDark),
} as const;
