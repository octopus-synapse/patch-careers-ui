/**
 * `NavMenuRow` — one row of the nav menu panel, with the prototype's hover
 * choreography (`menu-final.html`).
 *
 * Four things move together, and the timing is deliberately ASYMMETRIC: the
 * hover state arrives on a long eased curve and leaves fast and flat, so the
 * panel feels like it is answering you rather than lagging behind the pointer.
 *
 *   · a curtain of `indigoSoft` sweeps in from the left edge of the row;
 *   · the icon disc lifts — an opaque panel-coloured layer cross-fades over
 *     the resting hairline ring, carrying a small shadow and a 1.5% scale;
 *   · the glyph swaps for a heavier, indigo-tinted twin of itself (plus an
 *     optional per-glyph flourish — the gear turns, the sign-out arrow steps
 *     right);
 *   · the label thickens and takes the deeper indigo.
 *
 * Reanimated rather than Tamagui's `animation` prop because that asymmetry
 * needs a different duration AND easing per direction, which a named preset
 * cannot carry. `ToggleField` in the DS sets the same precedent.
 *
 * The label's weight switches instantly — no driver interpolates `fontWeight`,
 * and animating it would reflow the row. The label sits in a flex spacer so
 * the extra width is absorbed there and the mono value never shifts.
 */

import { editorialOverlays } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import {
  editorialFonts,
  useEditorialMenu,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import type { LucideIcon } from "lucide-react-native";
import { type ReactElement, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";

const DISC = 32;
const GLYPH = 18;
const ROW_RADIUS = 11;

/** Fills its relative parent — the curtain, the disc's ring and lift layer. */
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const CENTERED = { position: "absolute" } as const;

/** Arriving: long and eased. Leaving: short and flat. That gap is the design. */
const ENTER = { duration: 500, easing: Easing.bezier(0.22, 0.61, 0.36, 1) };
const EXIT = { duration: 200, easing: Easing.out(Easing.ease) };
const INSTANT = { duration: 0, easing: Easing.linear };

/** Where the hovered glyph settles — the prototype's per-glyph micro-moves. */
export type NavMenuGlyphFlourish = {
  /** Degrees. */
  readonly rotate?: number;
  readonly x?: number;
  readonly y?: number;
};

export type NavMenuRowProps = {
  readonly icon: LucideIcon;
  readonly label: string;
  /** The state this row leads to, in mono on the right — "pt-BR", "Claro". */
  readonly value?: string;
  readonly flourish?: NavMenuGlyphFlourish;
  readonly danger?: boolean;
  readonly onPress: () => void;
};

export function NavMenuRow({
  icon: Icon,
  label,
  value,
  flourish,
  danger = false,
  onPress,
}: NavMenuRowProps): ReactElement {
  const palette = useEditorialPalette();
  const menu = useEditorialMenu();
  const overlays = editorialOverlays[useThemeName()];
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  const on = hovered ? 1 : 0;
  // Resolved out here, not inside the worklets: a worklet may only close over
  // plain values, never over a helper defined on the JS side.
  const timing = reduceMotion ? INSTANT : hovered ? ENTER : EXIT;
  const still = reduceMotion;

  const spin = (deg: number): string => `${deg}deg`;
  const restRotate = spin(hovered && !still ? 3 : 0);
  const hoverRotate = spin(hovered ? (flourish?.rotate ?? 0) : -4);

  const curtainStyle = useAnimatedStyle(
    () => ({ transform: [{ scaleX: withTiming(on, timing) }] }),
    [on, timing],
  );

  const liftStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(on, timing),
      transform: [{ scale: withTiming(hovered && !still ? 1.015 : 1, timing) }],
    }),
    [on, hovered, still, timing],
  );

  const restGlyphStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(1 - on, timing),
      transform: [
        { translateY: withTiming(hovered && !still ? -2 : 0, timing) },
        { scale: withTiming(hovered && !still ? 0.88 : 1, timing) },
        { rotate: withTiming(restRotate, timing) },
      ],
    }),
    [on, hovered, still, restRotate, timing],
  );

  const hoverGlyphStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(on, timing),
      transform: [
        { translateX: withTiming(hovered && !still ? (flourish?.x ?? 0) : 0, timing) },
        { translateY: withTiming(hovered ? (still ? 0 : (flourish?.y ?? 0)) : 3, timing) },
        { scale: withTiming(hovered ? 1 : 0.84, timing) },
        { rotate: withTiming(hoverRotate, timing) },
      ],
    }),
    [on, hovered, still, hoverRotate, flourish, timing],
  );

  const glyphTint = danger ? palette.danger : menu.indigo;
  const labelTint = hovered ? (danger ? palette.danger : menu.indigoDeep) : palette.ink;

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <XStack
        alignItems="center"
        gap={12}
        paddingLeft={8}
        paddingRight={12}
        paddingVertical={8}
        borderRadius={ROW_RADIUS}
        overflow="hidden"
        // Opens a stacking context so the curtain's negative z-index stays
        // trapped inside this row instead of sliding behind the whole panel.
        zIndex={0}
      >
        {/* The curtain: anchored left so it wipes in rather than growing from
            the middle.

            `zIndex: -1` is load-bearing, not decoration. CSS paints POSITIONED
            descendants above in-flow content, so without it this absolutely
            positioned layer covers the label and the value — the row's text
            simply vanishes the moment you hover it. */}
        <Animated.View
          pointerEvents="none"
          style={[
            FILL,
            {
              zIndex: -1,
              borderRadius: ROW_RADIUS,
              transformOrigin: "left center",
              backgroundColor: danger ? overlays.dangerWash : menu.indigoSoft,
            },
            curtainStyle,
          ]}
        />

        <YStack width={DISC} height={DISC} alignItems="center" justifyContent="center">
          <YStack {...FILL} borderRadius={999} borderWidth={1} borderColor={palette.hairline} />
          {/* The lift is an opaque disc fading in OVER the ring — which is how
              the prototype hides the border without animating a colour. */}
          <Animated.View
            pointerEvents="none"
            style={[
              FILL,
              {
                borderRadius: DISC / 2,
                backgroundColor: palette.panel,
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 1 },
                shadowRadius: 2,
                shadowOpacity: reduceMotion ? 0 : 0.06,
              },
              liftStyle,
            ]}
          />
          <Animated.View pointerEvents="none" style={[CENTERED, restGlyphStyle]}>
            <Icon size={GLYPH} color={palette.muted} strokeWidth={1.5} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[CENTERED, hoverGlyphStyle]}>
            <Icon size={GLYPH} color={glyphTint} strokeWidth={2.1} />
          </Animated.View>
        </YStack>

        <Text
          flex={1}
          fontFamily={editorialFonts.sans}
          fontSize={14}
          lineHeight={18}
          fontWeight={hovered ? "600" : "400"}
          color={labelTint}
          numberOfLines={1}
        >
          {label}
        </Text>

        {value ? (
          <Text
            fontFamily={editorialFonts.mono}
            fontSize={11.5}
            color={hovered ? palette.body : palette.subtle}
          >
            {value}
          </Text>
        ) : null}
      </XStack>
    </Pressable>
  );
}
