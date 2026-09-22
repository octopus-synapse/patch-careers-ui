/**
 * EditorialOtp — the demo-approved OTP row: six drawn cells (dot placeholder,
 * blinking caret on the active cell, digits that pop in) over ONE invisible
 * TextInput. The single real field is what gives OS one-time-code autofill
 * and paste for free; the cells only draw its value.
 *
 * Visual states mirror `docs/design/verify-code-demo.html`: the active cell lifts with an
 * accent border, `error` washes the row red and shakes it, `done` washes it
 * with the accent, `loading` dims it.
 */

import { authDialogPalette } from "@patch-careers/tokens";
import { useEditorialPalette } from "@patch-careers/ui";
import { editorialFonts, useThemeName } from "@patch-careers/ui/editorial";
import { type ReactElement, type RefObject, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const OTP_CELL_WIDTH = 54;
export const OTP_CELL_HEIGHT = 62;
export const OTP_CELL_GAP = 8;

export type EditorialOtpState = "idle" | "loading" | "error" | "done";

const CELL_COUNT = 6;

export function EditorialOtp({
  value,
  onChangeText,
  state,
  accessibilityLabel,
  autoFocus,
  inputRef: externalRef,
  testID,
}: {
  value: string;
  onChangeText: (next: string) => void;
  state: EditorialOtpState;
  accessibilityLabel: string;
  autoFocus?: boolean;
  /** Lets the screen focus the field itself (e.g. after an intro finishes). */
  inputRef?: RefObject<TextInput | null>;
  testID?: string;
}): ReactElement {
  const palette = useEditorialPalette();
  const dialogPalette = authDialogPalette[useThemeName()];
  const internalRef = useRef<TextInput>(null);
  const inputRef = externalRef ?? internalRef;
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const { width } = useWindowDimensions();
  // Leave room for the /auth card's mobile gutters, padding and cell gaps.
  const cellWidth = Math.min(OTP_CELL_WIDTH, Math.max(0, (width - 124) / CELL_COUNT));
  const cellHeight = Math.min(OTP_CELL_HEIGHT, Math.max(44, cellWidth * 1.15));

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
            accent={dialogPalette.brandMuted}
            width={cellWidth}
            height={cellHeight}
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
  accent,
  width,
  height,
}: {
  char: string;
  active: boolean;
  state: EditorialOtpState;
  palette: ReturnType<typeof useEditorialPalette>;
  accent: string;
  width: number;
  height: number;
}): ReactElement {
  const filled = char.length > 0;
  const borderColor =
    state === "error"
      ? palette.danger
      : state === "done" || active
        ? accent
        : filled
          ? accent
          : `${accent}80`;
  const backgroundColor =
    state === "error"
      ? `${palette.danger}17`
      : state === "done"
        ? `${accent}1F`
        : filled || active
          ? palette.surface
          : palette.bg;
  const color = state === "error" ? palette.danger : palette.ink;

  return (
    <View
      style={[
        styles.cell,
        { width, height, borderColor, backgroundColor },
        active && styles.cellActive,
      ]}
    >
      {filled ? (
        <Animated.Text entering={FadeIn.duration(180)} style={[styles.digit, { color }]}>
          {char}
        </Animated.Text>
      ) : active ? (
        <Caret color={accent} />
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
    borderRadius: 10,
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
