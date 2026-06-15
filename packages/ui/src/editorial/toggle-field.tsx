/**
 * ToggleField — iOS-style on/off switch in the Editorial Calm DS.
 *
 * Built on the same Tamagui shim + editorial palette as `CheckboxField`
 * (not StyleSheet). Router-agnostic: the caller owns state via `value` +
 * `onValueChange`. The thumb slides with a short reanimated timing; the track
 * tints to `ink` when on, `hairlineStrong` when off.
 */

import type { ReactElement } from "react";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { TStack, TText, TXStack } from "../internal/tamagui-shim";
import { useEditorialPalette } from "../internal/use-editorial-palette";
import { editorialFonts } from "./fonts";

export type ToggleFieldProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Optional inline label rendered to the left of the track (flex-grows). */
  label?: string;
  testID?: string;
};

const TRACK_W = 44;
const TRACK_H = 26;
const THUMB = 22;
const PAD = 2;
const OFFSET_ON = TRACK_W - THUMB - PAD * 2; // 18

export function ToggleField({
  value,
  onValueChange,
  disabled = false,
  label,
  testID,
}: ToggleFieldProps): ReactElement {
  const palette = useEditorialPalette();

  const thumbStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: withTiming(value ? OFFSET_ON : 0, { duration: 160 }) }] }),
    [value],
  );

  const press = (): void => {
    if (!disabled) onValueChange(!value);
  };

  return (
    <TXStack
      onPress={press}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      {...(label ? { accessibilityLabel: label } : {})}
      alignItems="center"
      gap={12}
      cursor={disabled ? "default" : "pointer"}
      opacity={disabled ? 0.45 : 1}
      {...(testID ? { testID } : {})}
    >
      {label ? (
        <TText flex={1} fontFamily={editorialFonts.sans} fontSize={15} color={palette.ink}>
          {label}
        </TText>
      ) : null}
      <TStack
        width={TRACK_W}
        height={TRACK_H}
        borderRadius={TRACK_H / 2}
        padding={PAD}
        backgroundColor={value ? palette.ink : palette.hairlineStrong}
      >
        <Animated.View
          style={[
            thumbStyle,
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: palette.surface,
            },
          ]}
        />
      </TStack>
    </TXStack>
  );
}
