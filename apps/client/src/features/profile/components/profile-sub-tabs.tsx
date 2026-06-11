/**
 * Instagram-style sub-tab bar for the Profile screen, restyled editorial:
 * two small-caps segments over a full-width hairline, with a 1.5px ink
 * underline indicator that slides between them (dependency-free RN Animated,
 * same approach as ConfirmDialog).
 */
import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
} from "@patch-careers/tokens";
import { editorialFonts as fonts, useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export type ProfileSubTab = "perfil" | "curriculos";

const TABS: ReadonlyArray<{ key: ProfileSubTab; label: string }> = [
  { key: "perfil", label: "Perfil" },
  { key: "curriculos", label: "Currículos" },
];

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export function ProfileSubTabs({
  value,
  onChange,
}: {
  value: ProfileSubTab;
  onChange: (tab: ProfileSubTab) => void;
}): ReactElement {
  const styles = stylesByTheme[useThemeName()];
  const [width, setWidth] = useState(0);
  const index = TABS.findIndex((tab) => tab.key === value);
  const anim = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: index,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [index, anim]);

  const segment = width / TABS.length;
  const translateX = anim.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [0, segment * (TABS.length - 1)],
  });

  return (
    <View style={styles.root} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const selected = tab.key === value;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(tab.key)}
              style={styles.segment}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
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
