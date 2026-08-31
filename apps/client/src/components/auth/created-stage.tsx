/**
 * The "account created" stage — the hand-off between sign-up and verify-email.
 *
 * Both screens keep their own mascot instance (it has to scroll with the
 * card under the keyboard), so continuity is achieved by geometry instead of
 * a shared element: sign-up ends, and verify-email begins, on the very same
 * frame — the card clamped to `CREATED_STAGE_CARD_HEIGHT` with nothing in it
 * but this title, the mascot perched on top in its `sealed` rest, breathing
 * off the shared clock. The route crossfade then blends two identical
 * pictures and the character never appears to move.
 */

import { Text } from "@patch-careers/ui";
import { AUTH_CARD_PADDING_Y, editorialFonts } from "@patch-careers/ui/editorial";
import type { ReactElement } from "react";
import { Platform, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

const isWeb = Platform.OS === "web";

/** Title metrics shared with `CredentialsCard` so the swap is in place. */
export const AUTH_TITLE_FONT_SIZE = isWeb ? 30 : 28;
export const AUTH_TITLE_LINE_HEIGHT = isWeb ? 36 : 34;

/** Panel height while only the title is left: paddings + one title line. */
export const CREATED_STAGE_CARD_HEIGHT = AUTH_CARD_PADDING_Y * 2 + AUTH_TITLE_LINE_HEIGHT;

/** Sign-up side of the choreography, ms after the signup request succeeds. */
export const CREATED_TIMELINE = {
  /** Consent dialog has faded out; the snap starts and the form fades. */
  snapAt: 180,
  /** Title swaps to "Account created." — on the snap's grin beat. */
  titleAt: 180 + 660,
  /** The card collapses to the stage height once the snap has settled. */
  collapseAt: 1900,
  collapseMs: 520,
  /** Hold on the stage, then hand off to verify-email. */
  navigateAt: 4200,
} as const;

/** Verify-email side: ms after mount when arriving from sign-up. */
export const ARRIVAL_TIMELINE = {
  /** Route crossfade is over; the card grows and the stage title fades. */
  growAt: 380,
  growMs: 620,
  /** Verify content fades in over the grown card. */
  revealAt: 780,
  revealMs: 360,
  done: 1200,
} as const;

/** The centred "Account created." title, set in the auth title style. */
export function CreatedStageTitle({
  title,
  style,
}: {
  title: string;
  style?: StyleProp<ViewStyle>;
}): ReactElement {
  return (
    <Animated.View style={[styles.overlay, style]} pointerEvents="none">
      <Text
        textAlign="center"
        fontFamily={editorialFonts.sans}
        fontSize={AUTH_TITLE_FONT_SIZE}
        lineHeight={AUTH_TITLE_LINE_HEIGHT}
        fontWeight="600"
        letterSpacing={-0.4}
        color="$ink"
      >
        {title}
      </Text>
    </Animated.View>
  );
}

// @style-allow stylesheet: Reanimated overlay (animated opacity over the card's title slot)
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
});
