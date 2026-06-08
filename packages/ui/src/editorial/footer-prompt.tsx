/**
 * FooterPrompt — alternate-action link at the bottom.
 *
 * Router-agnostic: navigation via `onPress`.
 */

import type { ReactElement } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { TText, TXStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export type FooterPromptProps = {
  prompt: string;
  linkLabel: string;
  onPress: () => void;
  testID?: string;
};

export function FooterPrompt({
  prompt,
  linkLabel,
  onPress,
  testID,
}: FooterPromptProps): ReactElement {
  return (
    <Animated.View entering={FadeIn.delay(900).duration(500)}>
      <TXStack flexWrap="wrap" justifyContent="center" alignItems="center" marginTop={36}>
        <TText fontFamily={editorialFonts.sans} fontSize={13} color="$inkMuted">
          {prompt}{" "}
        </TText>
        <TText
          onPress={onPress}
          accessibilityRole="link"
          cursor="pointer"
          fontFamily={editorialFonts.sans}
          fontSize={13}
          color="$ink"
          fontWeight="600"
          {...(testID ? { testID } : {})}
        >
          {linkLabel} →
        </TText>
      </TXStack>
    </Animated.View>
  );
}
