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
