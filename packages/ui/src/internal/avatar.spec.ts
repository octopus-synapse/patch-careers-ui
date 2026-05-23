import { describe, expect, it } from "vitest";
import { avatarBackgroundColor, initialsFromName } from "./avatar";

describe("initialsFromName", () => {
  it("returns the two-letter initials for a multi-word name", () => {
    expect(initialsFromName("Ada Lovelace")).toBe("AL");
    expect(initialsFromName("Grace Hopper")).toBe("GH");
  });

  it("returns single letter for a single-word name", () => {
    expect(initialsFromName("Alan")).toBe("A");
  });

  it("falls back to `?` for empty / whitespace input", () => {
    expect(initialsFromName("")).toBe("?");
    expect(initialsFromName("   ")).toBe("?");
  });

  it("upper-cases the result", () => {
    expect(initialsFromName("ada lovelace")).toBe("AL");
  });

  it("handles 3+ words by taking first + last", () => {
    expect(initialsFromName("Margaret Hamilton Heafield")).toBe("MH");
  });
});

describe("avatarBackgroundColor", () => {
  it("is deterministic per input", () => {
    expect(avatarBackgroundColor("alice")).toBe(avatarBackgroundColor("alice"));
    expect(avatarBackgroundColor("bob")).toBe(avatarBackgroundColor("bob"));
  });

  it("returns a color string", () => {
    expect(avatarBackgroundColor("anything")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("does not throw on empty input", () => {
    expect(() => avatarBackgroundColor("")).not.toThrow();
  });
});
