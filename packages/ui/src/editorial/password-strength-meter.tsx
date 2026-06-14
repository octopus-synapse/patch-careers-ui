/**
 * PasswordStrengthMeter — 4 segments + score label + requirement chips.
 * Scoring/labels/colors come from `internal/editorial-password`.
 *
 * Stays collapsed (height 0 + invisible) while the field is empty and
 * reveals with an ease-in-out grow + fade the moment the first character
 * is typed. The measured content is positioned `absolute` so it sits
 * outside the animated container's height constraint and always reports
 * its natural height via onLayout (a child in normal flow under a
 * height:0 parent measures as 0 on iOS, which is why nothing showed).
 */

import { type ReactElement, useEffect, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  type PasswordHints,
  passwordChecks,
  STRENGTH_LABEL,
  type StrengthLabels,
  scorePassword,
  strengthColor,
} from "../internal/editorial-password";
import { TStack, TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

const SEGMENTS = [0, 1, 2, 3];

export function PasswordStrengthMeter({
  password,
  hints,
  strengthLabels,
}: {
  password: string;
  hints?: PasswordHints;
  strengthLabels?: StrengthLabels;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  const score = scorePassword(password);
  const color = strengthColor(editorialPalette, score);
  const label =
    score === 0 ? STRENGTH_LABEL[0] : (strengthLabels?.[score] ?? STRENGTH_LABEL[score]);
  const checks = passwordChecks(password, hints);

  const visible = password.length > 0;
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [visible, progress]);

  const containerStyle = useAnimatedStyle(() => ({
    height: contentHeight === 0 ? 0 : progress.value * contentHeight,
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -6 }],
  }));

  const onLayout = (e: LayoutChangeEvent): void => {
    const next = e.nativeEvent.layout.height;
    if (next > 0 && next !== contentHeight) setContentHeight(next);
  };

  return (
    <Animated.View style={[{ overflow: "hidden" }, containerStyle]} pointerEvents="none">
      <View style={{ position: "absolute", left: 0, right: 0, top: 0 }} onLayout={onLayout}>
        <TYStack marginTop={14} gap={10}>
          <TXStack gap={4}>
            {SEGMENTS.map((i) => (
              <TStack
                key={i}
                flex={1}
                height={3}
                backgroundColor="$hairline"
                borderRadius={2}
                overflow="hidden"
              >
                <TStack
                  flex={1}
                  borderRadius={2}
                  backgroundColor={i < score ? color : "transparent"}
                />
              </TStack>
            ))}
          </TXStack>
          <TXStack alignItems="center" justifyContent="space-between" gap={8}>
            <TText
              fontFamily={editorialFonts.sans}
              fontSize={11}
              fontWeight="600"
              letterSpacing={0.8}
              textTransform="uppercase"
              color={score > 0 ? color : editorialPalette.subtle}
            >
              {label}
            </TText>
            <TXStack gap={8} flexWrap="nowrap" flexShrink={1}>
              {checks.map((c) => (
                <TXStack key={c.label} alignItems="center" gap={4} flexShrink={0}>
                  <TStack
                    width={5}
                    height={5}
                    borderRadius={3}
                    backgroundColor={c.ok ? editorialPalette.success : editorialPalette.hairline}
                  />
                  <TText
                    fontFamily={editorialFonts.mono}
                    fontSize={10}
                    letterSpacing={0.4}
                    color={c.ok ? "$inkBody" : "$inkSubtle"}
                  >
                    {c.label}
                  </TText>
                </TXStack>
              ))}
            </TXStack>
          </TXStack>
        </TYStack>
      </View>
    </Animated.View>
  );
}
