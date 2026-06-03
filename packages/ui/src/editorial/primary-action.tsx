/**
 * PrimaryAction — deep-ink filled pill with an arrow that nudges on press.
 *
 * Keeps the Reanimated press choreography (container scale + arrow translate)
 * — a bespoke micro-animation the Tamagui driver can't replicate identically.
 */

import { editorialPalette } from "@patch-careers/tokens";
import { ArrowRight } from "lucide-react-native";
import type { ReactElement } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TText } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

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
  const inactive = loading || disabled;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(450).duration(600).easing(Easing.out(Easing.cubic))}>
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
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <TText
              fontFamily={editorialFonts.sans}
              fontSize={15}
              color="#FFFFFF"
              fontWeight="600"
              letterSpacing={0.2}
            >
              {label}
            </TText>
            <Animated.View style={arrowStyle}>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={1.75} />
            </Animated.View>
          </>
        )}
      </PressableAnimated>
    </Animated.View>
  );
}

const primaryStyles = StyleSheet.create({
  button: {
    backgroundColor: editorialPalette.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 54,
    shadowColor: editorialPalette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonInactive: { opacity: 0.55 },
});
