/**
 * AuthCard — the standalone panel the sign-in screen sits on.
 *
 * It follows the active scheme (no inversion): the `panel` token is a lift off
 * the screen's `bg` in both light and dark, so the card always reads as paper
 * laid on the background — without either side going to pure white or black.
 *
 * `maxWidth` keeps the 90% column from spanning a desktop browser; on phones
 * the clamp never engages.
 */

import type { ReactElement, ReactNode } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { TYStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";

export function AuthCard({ children }: { children: ReactNode }): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Animated.View entering={FadeIn.duration(420)}>
      <TYStack
        width="90%"
        maxWidth={460}
        alignSelf="center"
        borderRadius={30}
        backgroundColor={editorialPalette.panel}
        paddingHorizontal={26}
        paddingVertical={34}
      >
        {children}
      </TYStack>
    </Animated.View>
  );
}
