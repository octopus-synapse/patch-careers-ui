/**
 * PrimaryAction — deep-ink filled pill with an arrow that nudges on press.
 *
 * Keeps the Reanimated press choreography (container scale + arrow translate)
 * — a bespoke micro-animation the Tamagui driver can't replicate identically.
 */

import {
  type EditorialPalette,
  editorialPalette,
  editorialPaletteDark,
  radius,
} from "@patch-careers/tokens";
import { ArrowRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TText } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts } from "./fonts";
import { editorialFadeInDown } from "./motion";

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

export type PrimaryActionProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

export function PrimaryAction({
  label,
  onPress,
  loading = false,
  disabled = false,
  testID,
}: PrimaryActionProps): ReactElement {
  const scale = useSharedValue(1);
  const arrowX = useSharedValue(0);
  const palette = useEditorialPalette();
  const primaryStyles = stylesByTheme[useThemeName()];
  const inactive = loading || disabled;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <Animated.View entering={editorialFadeInDown(450, 600)}>
      <PressableAnimated
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.985, { duration: 80 });
          arrowX.value = withTiming(3, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 140 });
          arrowX.value = withTiming(0, { duration: 180 });
        }}
        style={[
          primaryStyles.button,
          inactive ? primaryStyles.buttonInactive : null,
          containerStyle,
        ]}
        {...(testID ? { testID } : {})}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.onPrimary} />
        ) : (
          <>
            <TText
              fontFamily={editorialFonts.sans}
              fontSize={15}
              color={palette.onPrimary}
              fontWeight="600"
              letterSpacing={0.2}
            >
              {label}
            </TText>
            <Animated.View style={arrowStyle}>
              <ArrowRight size={18} color={palette.onPrimary} strokeWidth={1.75} />
            </Animated.View>
          </>
        )}
      </PressableAnimated>
    </Animated.View>
  );
}

// Precomputed per theme so style-object identity stays stable across renders.
// The dark CTA is a light fill — its shadow stays black, not the fill color.
const stylesFor = (p: EditorialPalette, shadow: string) =>
  StyleSheet.create({
    button: {
      backgroundColor: p.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: radius.full,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      minHeight: 54,
      shadowColor: shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 3,
    },
    buttonInactive: { opacity: 0.55 },
  });

const stylesByTheme = {
  light: stylesFor(editorialPalette, editorialPalette.primary),
  dark: stylesFor(editorialPaletteDark, "#000000"),
} as const;
