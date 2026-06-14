import { describe, expect, it } from "vitest";
import {
  backspaceOtp,
  isOtpComplete,
  nextOtpIndex,
  OTP_DEFAULT_LENGTH,
  sanitizeOtp,
  splitOtp,
} from "./otp";

describe("sanitizeOtp", () => {
  it("strips non-digits", () => {
    expect(sanitizeOtp("12a3b4c5d6")).toBe("123456");
  });

  it("truncates to default length 6", () => {
    expect(sanitizeOtp("1234567890")).toBe("123456");
    expect(sanitizeOtp("1234567890").length).toBe(OTP_DEFAULT_LENGTH);
  });

  it("respects custom length", () => {
    expect(sanitizeOtp("1234567890", 4)).toBe("1234");
  });

  it("treats null-ish as empty", () => {
    expect(sanitizeOtp(undefined as unknown as string)).toBe("");
  });
});

describe("nextOtpIndex", () => {
  it("advances within range", () => {
    expect(nextOtpIndex(0)).toBe(1);
    expect(nextOtpIndex(4)).toBe(5);
  });

  it("returns -1 at boundary", () => {
    expect(nextOtpIndex(5)).toBe(-1);
    expect(nextOtpIndex(99)).toBe(-1);
  });

  it("returns -1 for negative index", () => {
    expect(nextOtpIndex(-1)).toBe(-1);
  });
});

describe("splitOtp", () => {
  it("always returns array of `length` items", () => {
    expect(splitOtp("12")).toHaveLength(OTP_DEFAULT_LENGTH);
    expect(splitOtp("123456")).toHaveLength(OTP_DEFAULT_LENGTH);
    expect(splitOtp("")).toHaveLength(OTP_DEFAULT_LENGTH);
  });

  it("fills missing slots with empty string", () => {
    expect(splitOtp("12")).toEqual(["1", "2", "", "", "", ""]);
  });
});

describe("backspaceOtp", () => {
  it("deletes the digit behind an empty active slot and focuses it", () => {
    // Typed "35", cursor in empty slot index 2 → delete "5", focus slot 1.
    expect(backspaceOtp("35", 2)).toEqual({ value: "3", focusIndex: 1 });
  });

  it("returns null when the active slot has its own digit (onChangeText handles it)", () => {
    expect(backspaceOtp("35", 1)).toBeNull();
  });

  it("returns null at the first slot (nothing behind it)", () => {
    expect(backspaceOtp("", 0)).toBeNull();
  });
});

describe("isOtpComplete", () => {
  it("returns true only when all slots filled", () => {
    expect(isOtpComplete("123456")).toBe(true);
    expect(isOtpComplete("12345")).toBe(false);
    expect(isOtpComplete("")).toBe(false);
  });
});
