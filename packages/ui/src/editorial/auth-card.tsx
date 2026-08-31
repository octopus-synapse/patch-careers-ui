/**
 * AuthCard — the standalone panel the sign-in screen sits on.
 *
 * It follows the active scheme (no inversion): the `panel` token is a lift off
 * the screen's `bg` in both light and dark, so the card always reads as paper
 * laid on the background — without either side going to pure white or black.
 *
 * `maxWidth` keeps the 90% column from spanning a desktop browser; on phones
 * the clamp never engages.
 *
 * `panelStyle` lets a screen drive the panel with a Reanimated style (the
 * sign-up → verify-email "account created" stage clamps its height); the
 * panel clips, so its content keeps its natural layout underneath and
 * `onContentLayout` reports that natural size.
 */

import type { ReactElement, ReactNode } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useEditorialPalette } from "../internal/use-editorial-palette";

export const AUTH_CARD_PADDING_Y = 34;

export function AuthCard({
  children,
  panelStyle,
  onContentLayout,
  animateIn = true,
}: {
  children: ReactNode;
  panelStyle?: StyleProp<ViewStyle>;
  onContentLayout?: (e: LayoutChangeEvent) => void;
  /** Off when the screen must open on another screen's exact frame. */
  animateIn?: boolean;
}): ReactElement {
  const editorialPalette = useEditorialPalette();
  return (
    <Animated.View {...(animateIn ? { entering: FadeIn.duration(420) } : {})}>
      <Animated.View
        style={[styles.panel, { backgroundColor: editorialPalette.panel }, panelStyle]}
      >
        <View onLayout={onContentLayout}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}

// @style-allow stylesheet: the panel is Reanimated-driven (animated height clamp on the created stage)
const styles = StyleSheet.create({
  panel: {
    width: "90%",
    maxWidth: 460,
    alignSelf: "center",
    borderRadius: 30,
    paddingHorizontal: 26,
    paddingVertical: AUTH_CARD_PADDING_Y,
    overflow: "hidden",
  },
});
