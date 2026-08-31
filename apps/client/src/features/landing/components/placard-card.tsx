/**
 * `PlacardText` — the line of the mascot's voice inside the card he holds.
 *
 * The card itself comes from the design system (`AuthMascotCard`); this is only
 * its contents. The copy swaps a beat AFTER the chapter changes and fades
 * rather than cutting, so it reads as him lifting a new card instead of the
 * words teleporting — and because only the text animates, the hands never
 * appear to let go.
 */

import { Text, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useState } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { landingSans } from "../lib/landing-fonts";

/** The beat the card waits before showing the new line. */
const SWAP_DELAY_MS = 320;
const FADE_MS = 180;

export interface PlacardTextProps {
  readonly text: string;
  readonly source?: string | undefined;
}

export function PlacardText({ text, source }: PlacardTextProps): ReactElement {
  const palette = useEditorialPalette();
  const [shown, setShown] = useState({ text, source });
  const fade = useSharedValue(1);

  useEffect(() => {
    if (shown.text === text) return;
    fade.value = withSequence(
      withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }),
      withDelay(40, withTiming(1, { duration: FADE_MS + 80, easing: Easing.out(Easing.quad) })),
    );
    const swap = setTimeout(() => setShown({ text, source }), SWAP_DELAY_MS);
    return () => clearTimeout(swap);
  }, [fade, shown.text, source, text]);

  const style = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={style}>
      <YStack>
        <Text fontFamily={landingSans} fontSize={17} lineHeight={23} color={palette.ink}>
          {shown.text}
        </Text>
        {shown.source ? (
          <Text
            fontFamily={editorialFonts.mono}
            fontSize={11}
            lineHeight={16}
            color={palette.subtle}
            marginTop={12}
          >
            {shown.source}
          </Text>
        ) : null}
      </YStack>
    </Animated.View>
  );
}
