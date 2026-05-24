import { describe, expect, it } from "vitest";
import { cooldownSecondsRemaining, extractToken, isValidEmail, maskEmail } from "./helpers";

describe("maskEmail", () => {
  it("keeps first char + domain, masks the rest", () => {
    expect(maskEmail("alice@gmail.com")).toBe("a****@gmail.com");
  });
  it("returns single-char local untouched", () => {
    expect(maskEmail("a@gmail.com")).toBe("a@gmail.com");
  });
  it("handles subdomains", () => {
    expect(maskEmail("foo.bar@sub.example.com")).toBe("f******@sub.example.com");
  });
  it("returns input unchanged when @ is missing", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
  it("returns input unchanged when @ is at start", () => {
    expect(maskEmail("@nope.com")).toBe("@nope.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a typical email", () => {
    expect(isValidEmail("alice@example.com")).toBe(true);
  });
  it("trims surrounding whitespace", () => {
    expect(isValidEmail("  alice@example.com  ")).toBe(true);
  });
  it("rejects missing @", () => {
    expect(isValidEmail("aliceexample.com")).toBe(false);
  });
  it("rejects missing TLD", () => {
    expect(isValidEmail("alice@example")).toBe(false);
  });
  it("rejects internal whitespace", () => {
    expect(isValidEmail("alice @example.com")).toBe(false);
  });
  it("rejects empty", () => {
    expect(isValidEmail("")).toBe(false);
  });
});

describe("extractToken", () => {
  it("extracts from a query string", () => {
    expect(extractToken("https://patchcareers.com/reset-password?token=abc123")).toBe("abc123");
  });
  it("extracts from a fragment", () => {
    expect(extractToken("https://patchcareers.com/reset-password#token=frag-token")).toBe(
      "frag-token",
    );
  });
  it("prefers the fragment when both are present", () => {
    expect(extractToken("https://example.com/?token=query-tok#token=frag-tok")).toBe("frag-tok");
  });
  it("supports an alternative param name", () => {
    expect(extractToken("https://example.com/?code=xyz", "code")).toBe("xyz");
  });
  it("returns null when the token is missing", () => {
    expect(extractToken("https://example.com/path")).toBeNull();
  });
  it("returns null when the token is empty", () => {
    expect(extractToken("https://example.com/?token=")).toBeNull();
  });
  it("falls back to raw query parsing for non-URL strings", () => {
    expect(extractToken("?token=fallback")).toBe("fallback");
  });
});

describe("cooldownSecondsRemaining", () => {
  it("returns 0 when never requested", () => {
    expect(cooldownSecondsRemaining(null, 60, 1_000_000)).toBe(0);
  });
  it("returns the full window immediately after request", () => {
    const now = 1_000_000;
    expect(cooldownSecondsRemaining(now, 60, now)).toBe(60);
  });
  it("counts down as time elapses", () => {
    const start = 1_000_000;
    expect(cooldownSecondsRemaining(start, 60, start + 30_000)).toBe(30);
  });
  it("clamps to 0 once the window passes", () => {
    const start = 1_000_000;
    expect(cooldownSecondsRemaining(start, 60, start + 90_000)).toBe(0);
  });
});
