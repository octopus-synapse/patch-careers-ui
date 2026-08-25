/**
 * FieldError — small danger text below an input, fades in.
 *
 * Mono like the DS's other captions, but with NO tracking: letter-spacing
 * in this system is reserved for uppercase labels (1.2–1.8); on a
 * sentence-length monospace line it read as "spread out".
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
        fontSize={12}
        lineHeight={16}
        color="$editorialDanger"
      >
        {text}
      </TText>
    </Animated.View>
  );
}
