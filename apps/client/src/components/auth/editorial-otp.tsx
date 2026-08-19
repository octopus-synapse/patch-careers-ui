/**
 * EditorialOtp — the demo-approved OTP row: six drawn cells (dot placeholder,
 * blinking caret on the active cell, digits that pop in) over ONE invisible
 * TextInput. The single real field is what gives OS one-time-code autofill
 * and paste for free; the cells only draw its value.
 *
 * Visual states mirror `verify-code-demo.html`: the active cell lifts with an
 * accent border, `error` washes the row red and shakes it, `done` washes it
 * with the accent, `loading` dims it.
 */

import { useEditorialPalette } from "@patch-careers/ui";
import { editorialFonts } from "@patch-careers/ui/editorial";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const OTP_CELL_WIDTH = 50;
export const OTP_CELL_HEIGHT = 57;
export const OTP_CELL_GAP = 8;

export type EditorialOtpState = "idle" | "loading" | "error" | "done";

const CELL_COUNT = 6;

export function EditorialOtp({
  value,
  onChangeText,
  state,
  accessibilityLabel,
  autoFocus,
  testID,
}: {
  value: string;
  onChangeText: (next: string) => void;
  state: EditorialOtpState;
  accessibilityLabel: string;
  autoFocus?: boolean;
  testID?: string;
}): ReactElement {
  const palette = useEditorialPalette();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (state !== "error") return;
    shake.value = withSequence(
      withTiming(-5, { duration: 80 }),
      withTiming(5, { duration: 80 }),
      withTiming(-3, { duration: 80 }),
      withTiming(3, { duration: 80 }),
      withTiming(0, { duration: 80 }),
    );
  }, [state, shake]);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const editable = state === "idle";
  const activeIndex = Math.min(value.length, CELL_COUNT - 1);

  return (
    <Animated.View style={[styles.row, rowStyle, state === "loading" && styles.rowLoading]}>
      {Array.from({ length: CELL_COUNT }, (_, i) => {
        const char = value[i] ?? "";
        const active = focused && editable && i === activeIndex;
        return (
          <Cell
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length, position-keyed row
            key={i}
            char={char}
            active={active}
            state={state}
            palette={palette}
          />
        );
      })}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => inputRef.current?.focus()}
        disabled={!editable}
        accessibilityElementsHidden
      >
        <TextInput
          ref={inputRef}
          style={styles.proxy}
          value={value}
          onChangeText={(raw) => onChangeText(raw.replace(/\D/g, "").slice(0, CELL_COUNT))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={CELL_COUNT}
          caretHidden
          editable={editable}
          autoFocus={autoFocus ?? false}
          accessibilityLabel={accessibilityLabel}
          {...(testID ? { testID } : {})}
        />
      </Pressable>
    </Animated.View>
  );
}

function Cell({
  char,
  active,
  state,
  palette,
}: {
  char: string;
  active: boolean;
  state: EditorialOtpState;
  palette: ReturnType<typeof useEditorialPalette>;
}): ReactElement {
  const filled = char.length > 0;
  const borderColor =
    state === "error"
      ? palette.danger
      : state === "done" || active
        ? palette.accent
        : filled
          ? palette.hairlineStrong
          : palette.hairline;
  const backgroundColor =
    state === "error"
      ? `${palette.danger}17`
      : state === "done"
        ? `${palette.accent}1F`
        : filled || active
          ? palette.surface
          : palette.bg;
  const color = state === "error" ? palette.danger : palette.ink;

  return (
    <View style={[styles.cell, { borderColor, backgroundColor }, active && styles.cellActive]}>
      {filled ? (
        <Animated.Text entering={FadeIn.duration(180)} style={[styles.digit, { color }]}>
          {char}
        </Animated.Text>
      ) : active ? (
        <Caret color={palette.accent} />
      ) : (
        <View style={[styles.dot, { backgroundColor: palette.hairlineStrong }]} />
      )}
    </View>
  );
}

function Caret({ color }: { color: string }): ReactElement {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 440 }),
        withTiming(0, { duration: 80 }),
        withTiming(0, { duration: 440 }),
      ),
      -1,
    );
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.caret, { backgroundColor: color }, style]} />;
}

// @style-allow stylesheet: Reanimated OTP row (animated shake/caret + invisible proxy input need plain style objects)
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: OTP_CELL_GAP,
    alignSelf: "center",
  },
  rowLoading: {
    opacity: 0.5,
  },
  cell: {
    width: OTP_CELL_WIDTH,
    height: OTP_CELL_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellActive: {
    transform: [{ translateY: -3 }],
  },
  digit: {
    fontFamily: editorialFonts.mono,
    fontSize: 26,
    lineHeight: 30,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  caret: {
    width: 1.5,
    height: 24,
    borderRadius: 1,
  },
  proxy: {
    flex: 1,
    opacity: 0,
  },
});
