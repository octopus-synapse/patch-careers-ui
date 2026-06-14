/**
 * `<OTPInput>` — 6-digit verification code input with auto-focus chaining.
 *
 * String manipulation is delegated to `sanitizeOtp/splitOtp/nextOtpIndex`
 * (pure) so behavior is covered by `internal/otp.spec.ts`. The wrapper
 * only handles refs + focus.
 */

import { createRef, useEffect, useMemo, useRef } from "react";
import {
  backspaceOtp,
  isOtpComplete,
  nextOtpIndex,
  OTP_DEFAULT_LENGTH,
  sanitizeOtp,
  splitOtp,
} from "../internal/otp";
import { TInput, TXStack } from "../internal/tamagui-shim";

type RnInputRef = { focus: () => void };

export type OTPInputProps = {
  value: string;
  onChangeText: (next: string) => void;
  onComplete?: (final: string) => void;
  length?: number;
  autoFocus?: boolean;
};

export function OTPInput({
  value,
  onChangeText,
  onComplete,
  length = OTP_DEFAULT_LENGTH,
  autoFocus,
}: OTPInputProps) {
  const slots = splitOtp(value, length);
  const refs = useMemo(() => Array.from({ length }, () => createRef<RnInputRef>()), [length]);
  const completionFired = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      refs[0]?.current?.focus();
    }
  }, [autoFocus, refs]);

  useEffect(() => {
    if (isOtpComplete(value, length)) {
      if (!completionFired.current) {
        completionFired.current = true;
        onComplete?.(sanitizeOtp(value, length));
      }
    } else {
      completionFired.current = false;
    }
  }, [value, length, onComplete]);

  function handleSlot(index: number, raw: string) {
    const digits = sanitizeOtp(raw, length - index);
    if (digits.length === 0) {
      const next = `${value.slice(0, index)}${value.slice(index + 1)}`;
      onChangeText(sanitizeOtp(next, length));
      return;
    }
    const before = value.slice(0, index);
    const after = value.slice(index + digits.length);
    onChangeText(sanitizeOtp(`${before}${digits}${after}`, length));
    const focusTarget = nextOtpIndex(index + digits.length - 1, length);
    if (focusTarget >= 0) {
      refs[focusTarget]?.current?.focus();
    }
  }

  // Backspace from an empty slot has no text change to fire `onChangeText`,
  // so we delete the digit behind the active slot ourselves.
  function handleKeyPress(index: number, key: string) {
    if (key !== "Backspace") return;
    const result = backspaceOtp(value, index, length);
    if (!result) return;
    onChangeText(result.value);
    refs[result.focusIndex]?.current?.focus();
  }

  return (
    <TXStack gap={8} accessibilityRole="none" accessibilityLabel="Código de verificação">
      {slots.map((digit, i) => (
        <TInput
          // biome-ignore lint/suspicious/noArrayIndexKey: OTP slot indexes are stable and meaningful
          key={i}
          ref={refs[i]}
          value={digit}
          onChangeText={(raw: string) => handleSlot(i, raw)}
          onKeyPress={(e: { nativeEvent: { key: string } }) =>
            handleKeyPress(i, e.nativeEvent.key)
          }
          maxLength={length}
          keyboardType="number-pad"
          textAlign="center"
          width={44}
          minHeight={48}
          fontSize={20}
        />
      ))}
    </TXStack>
  );
}
