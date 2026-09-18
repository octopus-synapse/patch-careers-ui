/** Action pill with an animated solid style or a static, transparent ghost style. */
import { editorialPalette, navFilled } from "@patch-careers/tokens";
import { type ReactElement, type ReactNode, useState } from "react";
import { Platform, Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { TText, TXStack, TYStack } from "../internal/tamagui-shim";
import { useThemeName } from "../internal/use-theme-name";
import { editorialFonts } from "./fonts";

const FILL = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;
const TIMING = { duration: 300, easing: Easing.bezier(0.16, 1, 0.3, 1) };
const INSTANT = { duration: 0, easing: Easing.linear };

export type PillButtonProps = {
  label: string;
  onPress: () => void;
  /** Ghost uses black foreground, a transparent background and no hover fill. */
  variant?: "solid" | "accent" | "soft" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  minHeight?: number;
  borderRadius?: number;
  /** Resting background only; text, icons and the hover fill stay opaque. */
  backgroundOpacity?: number;
  /** Web backdrop blur in pixels; leaves the foreground sharp. */
  backdropBlur?: number;
  iconOnly?: boolean;
  iconPosition?: "start" | "end";
  renderIcon?: (args: { color: string; size: number }) => ReactNode;
};

export function PillButton({
  label,
  onPress,
  variant = "solid",
  disabled = false,
  fullWidth = false,
  minHeight = 44,
  borderRadius = 999,
  backgroundOpacity = 1,
  backdropBlur = 0,
  iconOnly = false,
  iconPosition = "start",
  renderIcon,
}: PillButtonProps): ReactElement {
  const filled = navFilled[useThemeName()];
  const isGhost = variant === "ghost";
  const isSoft = variant === "soft";
  const isAccent = variant === "accent";
  const foreground = isGhost
    ? editorialPalette.ink
    : isSoft
      ? editorialPalette.accentDeep
      : isAccent
        ? editorialPalette.onPrimary
        : filled.onFill;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const reduceMotion = useReducedMotion();
  const on = !isGhost && !isSoft && !disabled && (hovered || focused || pressed) ? 1 : 0;
  const timing = reduceMotion ? INSTANT : TIMING;
  const fillStyle = useAnimatedStyle(() => ({ opacity: withTiming(on, timing) }), [on, timing]);
  const icon = renderIcon?.({ color: foreground, size: 16 });
  const backgroundAlpha = Math.round(Math.max(0, Math.min(1, backgroundOpacity)) * 255)
    .toString(16)
    .padStart(2, "0");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={isGhost || isSoft ? undefined : () => setHovered(true)}
      onHoverOut={isGhost || isSoft ? undefined : () => setHovered(false)}
      onFocus={isGhost || isSoft ? undefined : () => setFocused(true)}
      onBlur={isGhost || isSoft ? undefined : () => setFocused(false)}
      onPressIn={isGhost || isSoft ? undefined : () => setPressed(true)}
      onPressOut={isGhost || isSoft ? undefined : () => setPressed(false)}
      style={{ alignSelf: fullWidth ? "stretch" : "flex-start", borderRadius }}
    >
      <TYStack
        position="relative"
        backgroundColor={
          isGhost
            ? "transparent"
            : isSoft
              ? `${editorialPalette.primary}${Math.round(backgroundOpacity * 0.13 * 255)
                  .toString(16)
                  .padStart(2, "0")}`
              : isAccent
                ? editorialPalette.primary
                : `${editorialPalette.ink}${backgroundAlpha}`
        }
        borderRadius={borderRadius}
        minHeight={minHeight}
        width={iconOnly ? minHeight : undefined}
        paddingHorizontal={iconOnly ? 0 : 20}
        paddingVertical={iconOnly ? 0 : 12}
        alignItems="center"
        justifyContent="center"
        opacity={disabled ? 0.5 : 1}
        style={
          Platform.OS === "web" && backdropBlur > 0
            ? {
                backdropFilter: `blur(${backdropBlur}px)`,
                WebkitBackdropFilter: `blur(${backdropBlur}px)`,
              }
            : undefined
        }
      >
        {isGhost ? null : (
          <Animated.View
            pointerEvents="none"
            style={[FILL, { backgroundColor: filled.accent, borderRadius }, fillStyle]}
          />
        )}
        {/* Keep text and SVGs above the animated fill in the web paint order. */}
        <TXStack
          position="relative"
          zIndex={1}
          alignItems="center"
          justifyContent="center"
          maxWidth="100%"
          gap={8}
          pointerEvents="none"
        >
          {iconPosition === "start" ? icon : null}
          {iconOnly ? null : (
            <TText
              fontFamily={editorialFonts.sans}
              fontSize={13.5}
              fontWeight="600"
              lineHeight={20}
              color={foreground}
              textAlign="center"
              flexShrink={1}
            >
              {label}
            </TText>
          )}
          {iconPosition === "end" ? icon : null}
        </TXStack>
      </TYStack>
    </Pressable>
  );
}
