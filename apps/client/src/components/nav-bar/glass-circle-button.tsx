/**
 * `GlassCircleButton` — the navbar's circular control: messages, the
 * notification bell and the hamburger.
 *
 * At rest, a white surface with a hairline ring and dark glyph. A pointer over
 * it, an open menu, or an active destination reveals the brand indigo fill
 * with a white glyph on top.
 *
 * How the fill is drawn matters. It is an opaque layer fading in OVER the
 * resting circle, inset by -1 so it covers the hairline too — never an animated
 * `borderColor`/`backgroundColor`. Same reason the reference this was ported
 * from writes `hover:border-transparent` instead of dropping the border: the
 * 42px box must never change, or the three controls jump on hover. The glyph
 * can't be tinted mid-flight either (it's an SVG), so two copies cross-fade —
 * the same technique `NavMenuRow` uses for its heavier hover twin.
 *
 * Reanimated rather than Tamagui's `animation` prop, following `NavMenuRow`.
 * Here the curve is symmetric, though: 300ms on the reference's `ease-silk`
 * both ways. A control answering a pointer has no direction to dramatise.
 */

import { appNavControl, appNavPalette, navControlRest, navFilled } from "@patch-careers/tokens";
import { YStack } from "@patch-careers/ui";
import { CountBadge, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { NAV_CONTROL_SIZE, NAV_CONTROL_SIZE_APP } from "./nav-bar.contract";

/** Fills its relative parent, spilling 1px out to swallow the hairline ring. */
const OVER_RING = { position: "absolute", top: -1, right: -1, bottom: -1, left: -1 } as const;
const CENTERED = { position: "absolute" } as const;

/** The reference's `duration-300 ease-silk`, in both directions. */
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };
const APP_TIMING = { duration: 140, easing: Easing.out(Easing.quad) };

export function GlassCircleButton({
  renderIcon,
  badgeCount = 0,
  onPress,
  accessibilityLabel,
  expanded,
  active = false,
  filledAtRest = false,
  appearance = "default",
  reducedMotion = false,
}: {
  /** Called twice — once per cross-faded layer — with that layer's colour. */
  readonly renderIcon: (args: { color: string; filled: boolean }) => ReactNode;
  /** The unread count riding the glyph's corner; inverts under the fill. */
  readonly badgeCount?: number;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  /** Present only on menu triggers — drives `aria-expanded`. */
  readonly expanded?: boolean;
  /** The destination this control leads to is the current one. */
  readonly active?: boolean;
  /** Keeps menu triggers in the same green used by their hover state. */
  readonly filledAtRest?: boolean;
  readonly appearance?: "default" | "app";
  readonly reducedMotion?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const filled = navFilled[theme];
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const app = appearance === "app";
  const size = app ? NAV_CONTROL_SIZE_APP : NAV_CONTROL_SIZE;

  const on = filledAtRest || expanded === true || active || hovered || (app && pressed) ? 1 : 0;
  const timing = reduceMotion || reducedMotion ? INSTANT : app ? APP_TIMING : TIMING;
  const fillColor = app ? (pressed ? appNavControl.pressed : appNavControl.fill) : filled.accent;

  const fillStyle = useAnimatedStyle(() => ({ opacity: withTiming(on, timing) }), [on, timing]);
  const restStyle = useAnimatedStyle(() => ({ opacity: withTiming(1 - on, timing) }), [on, timing]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={expanded === undefined ? { selected: active } : { expanded }}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={app ? { borderRadius: 999, outlineColor: fillColor } : undefined}
    >
      <YStack
        width={size}
        height={size}
        borderRadius={999}
        borderWidth={1}
        borderColor={app ? appNavPalette[theme].hairline : palette.hairline}
        backgroundColor={navControlRest.bg}
        alignItems="center"
        justifyContent="center"
      >
        <Animated.View
          pointerEvents="none"
          style={[OVER_RING, { borderRadius: 999, backgroundColor: fillColor }, fillStyle]}
        />

        {/* Anchor the app badge to the 20px glyph while keeping both icon
            layers centred in the button. */}
        <YStack
          position="relative"
          width={app ? 20 : undefined}
          height={app ? 20 : undefined}
          alignItems="center"
          justifyContent="center"
        >
          <Animated.View pointerEvents="none" style={[CENTERED, restStyle]}>
            {renderIcon({ color: navControlRest.ink, filled: false })}
          </Animated.View>
          <Animated.View pointerEvents="none" style={[CENTERED, fillStyle]}>
            {renderIcon({ color: filled.onFill, filled: true })}
          </Animated.View>

          {!app && badgeCount > 0 ? (
            <>
              <Animated.View pointerEvents="none" style={restStyle}>
                <CountBadge count={badgeCount} />
              </Animated.View>
              <Animated.View pointerEvents="none" style={fillStyle}>
                <CountBadge count={badgeCount} inverted />
              </Animated.View>
            </>
          ) : null}
          {app ? (
            <CountBadge count={badgeCount} showZero appearance="navbar" inverted={on === 1} />
          ) : null}
        </YStack>
      </YStack>
    </Pressable>
  );
}
