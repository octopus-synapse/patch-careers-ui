/**
 * An account-menu row using the same interaction language as SettingsRail:
 * a full brand-colour pill, inverted copy, and a white icon disc on hover.
 */

import { navFilled } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
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
const GLYPH = 17;
const ROW_HEIGHT = 48;
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const CENTERED = { position: "absolute" } as const;
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };

export type NavMenuRowProps = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value?: string;
  readonly danger?: boolean;
  readonly onPress: () => void;
};

export function NavMenuRow({
  icon: Icon,
  label,
  value,
  danger = false,
  onPress,
}: NavMenuRowProps): ReactElement {
  const palette = useEditorialPalette();
  const filled = navFilled[useThemeName()];
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const fill = danger ? filled.danger : filled.accent;
  const on = hovered ? 1 : 0;
  const timing = reduceMotion ? INSTANT : TIMING;
  const restColor = danger ? palette.danger : palette.body;

  const fillStyle = useAnimatedStyle(() => ({ opacity: withTiming(on, timing) }), [on, timing]);
  const restStyle = useAnimatedStyle(() => ({ opacity: withTiming(1 - on, timing) }), [on, timing]);

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({ opacity: pressed ? 0.86 : 1 })}
    >
      <XStack
        alignItems="center"
        gap={12}
        height={ROW_HEIGHT}
        paddingLeft={8}
        paddingRight={16}
        borderRadius={999}
        zIndex={0}
      >
        <Animated.View
          pointerEvents="none"
          style={[FILL, { zIndex: -1, borderRadius: 999, backgroundColor: fill }, fillStyle]}
        />

        <YStack width={DISC} height={DISC} alignItems="center" justifyContent="center">
          <YStack {...FILL} borderRadius={999} borderWidth={1} borderColor={palette.hairline} />
          <Animated.View
            pointerEvents="none"
            style={[FILL, { borderRadius: DISC / 2, backgroundColor: palette.panel }, fillStyle]}
          />
          <Animated.View pointerEvents="none" style={[CENTERED, restStyle]}>
            <Icon size={GLYPH} color={restColor} strokeWidth={1.75} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[CENTERED, fillStyle]}>
            <Icon size={GLYPH} color={fill} strokeWidth={2} />
          </Animated.View>
        </YStack>

        <Text
          flex={1}
          fontFamily={editorialFonts.sans}
          fontSize={13.5}
          fontWeight={hovered ? "600" : "400"}
          color={hovered ? filled.onFill : restColor}
          numberOfLines={1}
        >
          {label}
        </Text>

        {value ? (
          <Text
            fontFamily={editorialFonts.mono}
            fontSize={11.5}
            color={hovered ? `${filled.onFill}B3` : palette.subtle}
          >
            {value}
          </Text>
        ) : null}
      </XStack>
    </Pressable>
  );
}
