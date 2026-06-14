/**
 * Pure helpers powering `<OTPInput>`.
 *
 * The component delegates string manipulation (paste/sanitize/forward)
 * to these functions so we can test the behavior without rendering.
 */

export const OTP_DEFAULT_LENGTH = 6;

/**
 * Keep only digits, truncate to `length`. Used both for paste handling
 * and as the final "validate" check before submitting.
 */
export function sanitizeOtp(input: string, length = OTP_DEFAULT_LENGTH): string {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits.slice(0, length);
}

/**
 * Computes the next focus index after a key input.
 * Returns -1 if there's nowhere left to focus forward.
 */
export function nextOtpIndex(currentIndex: number, length = OTP_DEFAULT_LENGTH): number {
  if (currentIndex < 0) return -1;
  const next = currentIndex + 1;
  if (next >= length) return -1;
  return next;
}

/**
 * Splits a sanitized OTP string into a fixed-length slot array.
 * Empty slots are filled with "".
 */
export function splitOtp(value: string, length = OTP_DEFAULT_LENGTH): string[] {
  const sanitized = sanitizeOtp(value, length);
  const slots: string[] = [];
  for (let i = 0; i < length; i++) {
    slots.push(sanitized[i] ?? "");
  }
  return slots;
}

export function isOtpComplete(value: string, length = OTP_DEFAULT_LENGTH): boolean {
  return sanitizeOtp(value, length).length === length;
}

/**
 * Backspace from an *empty* slot: deletes the digit behind the active slot
 * (the previous filled box) and reports where focus should land.
 *
 * Returns `null` when there's nothing to delete (slot has its own digit —
 * handled by `onChangeText` instead — or the cursor is at the first slot).
 */
export function backspaceOtp(
  value: string,
  index: number,
  length = OTP_DEFAULT_LENGTH,
): { value: string; focusIndex: number } | null {
  const sanitized = sanitizeOtp(value, length);
  if (sanitized[index]) return null;
  const target = index - 1;
  if (target < 0) return null;
  const next = `${sanitized.slice(0, target)}${sanitized.slice(target + 1)}`;
  return { value: sanitizeOtp(next, length), focusIndex: target };
}
