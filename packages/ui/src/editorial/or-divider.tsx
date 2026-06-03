/**
 * OrDivider — "or continue with" centered between hairlines.
 */

import type { ReactElement } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { TStack, TText, TXStack } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export function OrDivider({ text }: { text: string }): ReactElement {
  return (
    <Animated.View entering={FadeIn.delay(600).duration(500)}>
      <TXStack alignItems="center" gap={16} marginVertical={28}>
        <TStack flex={1} height={1} backgroundColor="$hairline" />
        <TText
          fontFamily={editorialFonts.sans}
          fontSize={11}
          color="$inkMuted"
          letterSpacing={1.8}
          fontWeight="500"
          textTransform="uppercase"
        >
          {text}
        </TText>
        <TStack flex={1} height={1} backgroundColor="$hairline" />
      </TXStack>
    </Animated.View>
  );
}
