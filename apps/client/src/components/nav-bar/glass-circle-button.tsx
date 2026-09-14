/**
 * `GlassCircleButton` — the navbar's circular control: messages, the
 * notification bell and the hamburger.
 *
 * At rest, a hairline ring over a translucent wash, so the controls read as one
 * material sitting ON the bar rather than as separate buttons. Engaged — a
 * pointer over it, its menu open, or the destination it leads to being the
 * current one — the glass gives way to a solid fill of the BRAND indigo with
 * the glyph inverted on top: the bar's one spot of colour, and the only place
 * the mark's blue appears in the product chrome.
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

import { editorialOverlays, navFilled } from "@patch-careers/tokens";
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
import { NAV_CONTROL_SIZE } from "./nav-bar.contract";

/** Fills its relative parent, spilling 1px out to swallow the hairline ring. */
const OVER_RING = { position: "absolute", top: -1, right: -1, bottom: -1, left: -1 } as const;
const CENTERED = { position: "absolute" } as const;

/** The reference's `duration-300 ease-silk`, in both directions. */
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };

export function GlassCircleButton({
  renderIcon,
  badgeCount = 0,
  onPress,
  accessibilityLabel,
  expanded,
  active = false,
}: {
  /** Called twice — once per cross-faded layer — with that layer's colour. */
  readonly renderIcon: (args: { color: string }) => ReactNode;
  /** The unread count riding the glyph's corner; inverts under the fill. */
  readonly badgeCount?: number;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  /** Present only on menu triggers — drives `aria-expanded`. */
  readonly expanded?: boolean;
  /** The destination this control leads to is the current one. */
  readonly active?: boolean;
}): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const overlays = editorialOverlays[theme];
  const filled = navFilled[theme];
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const on = expanded === true || active || hovered ? 1 : 0;
  const timing = reduceMotion ? INSTANT : TIMING;

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
    >
      <YStack
        width={NAV_CONTROL_SIZE}
        height={NAV_CONTROL_SIZE}
        borderRadius={999}
        borderWidth={1}
        borderColor={palette.hairline}
        backgroundColor={overlays.navGlass}
        alignItems="center"
        justifyContent="center"
      >
        <Animated.View
          pointerEvents="none"
          style={[OVER_RING, { borderRadius: 999, backgroundColor: filled.accent }, fillStyle]}
        />

        {/* Zero-size anchor: the badge hangs off the glyph's corner without
            nudging it off the button's centre. */}
        <YStack position="relative" alignItems="center" justifyContent="center">
          <Animated.View pointerEvents="none" style={[CENTERED, restStyle]}>
            {renderIcon({ color: palette.ink })}
          </Animated.View>
          <Animated.View pointerEvents="none" style={[CENTERED, fillStyle]}>
            {renderIcon({ color: filled.onFill })}
          </Animated.View>

          {badgeCount > 0 ? (
            <>
              <Animated.View pointerEvents="none" style={restStyle}>
                <CountBadge count={badgeCount} />
              </Animated.View>
              <Animated.View pointerEvents="none" style={fillStyle}>
                <CountBadge count={badgeCount} inverted />
              </Animated.View>
            </>
          ) : null}
        </YStack>
      </YStack>
    </Pressable>
  );
}
