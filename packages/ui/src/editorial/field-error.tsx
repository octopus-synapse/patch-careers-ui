/**
 * FieldError — small danger text below an input, fades in.
 */

import type { ReactElement } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { TText } from "../internal/tamagui-shim";
import { editorialFonts } from "./fonts";

export function FieldError({ text }: { text: string }): ReactElement {
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <TText
        marginTop={8}
        fontFamily={editorialFonts.mono}
        fontSize={11}
        color="$editorialDanger"
        letterSpacing={0.4}
      >
        {text}
      </TText>
    </Animated.View>
  );
}
