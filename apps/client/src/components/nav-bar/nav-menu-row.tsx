/**
 * An account-menu row using the same interaction language as SettingsRail:
 * a full brand-colour pill, inverted copy, and a white icon disc on hover.
 */

import { authDialogPalette, navFilled } from "@patch-careers/tokens";
import { Text, XStack, YStack } from "@patch-careers/ui";
import { editorialFonts, useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
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
const FULLSCREEN_ROW_HEIGHT = 68;
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
const CENTERED = { position: "absolute" } as const;
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };

export type NavMenuRowProps = {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly danger?: boolean;
  readonly disabled?: boolean;
  readonly fullscreen?: boolean;
  readonly first?: boolean;
  readonly onPress?: () => void;
};

export function NavMenuRow({
  icon: Icon,
  label,
  danger = false,
  disabled = false,
  fullscreen = false,
  first = false,
  onPress,
}: NavMenuRowProps): ReactElement {
  const palette = useEditorialPalette();
  const theme = useThemeName();
  const filled = navFilled[theme];
  const authColors = authDialogPalette[theme];
  const fullscreenInk = palette.body;
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const fill = danger ? filled.danger : filled.accent;
  const on = hovered && !disabled ? 1 : 0;
  const timing = reduceMotion ? INSTANT : TIMING;
  const restColor = danger ? palette.danger : palette.body;

  const fillStyle = useAnimatedStyle(() => ({ opacity: withTiming(on, timing) }), [on, timing]);
  const restStyle = useAnimatedStyle(() => ({ opacity: withTiming(1 - on, timing) }), [on, timing]);

  if (fullscreen) {
    return (
      <Pressable
        accessibilityRole="menuitem"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <XStack
          minHeight={FULLSCREEN_ROW_HEIGHT}
          alignItems="center"
          gap={18}
          borderTopWidth={first ? 0 : 1}
          borderColor={authColors.panelBorder}
        >
          <Icon size={19} color={danger ? palette.danger : fullscreenInk} strokeWidth={1.6} />
          <Text
            flex={1}
            fontFamily={editorialFonts.sans}
            fontSize={16}
            fontWeight="600"
            color={danger ? palette.danger : fullscreenInk}
          >
            {label}
          </Text>
          <ChevronRight size={16} color={fullscreenInk} strokeWidth={1.5} />
        </XStack>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
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
      </XStack>
    </Pressable>
  );
}
