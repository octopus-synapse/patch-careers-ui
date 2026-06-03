import { describe, expect, it } from "vitest";
import { editorialPalette } from "./editorial";

describe("editorialPalette", () => {
  const slots = [
    "bg",
    "surface",
    "ink",
    "body",
    "muted",
    "subtle",
    "hairline",
    "hairlineStrong",
    "accent",
    "accentDeep",
    "primary",
    "primaryPress",
    "danger",
    "success",
    "warn",
    "fair",
  ] as const;

  it("exposes every editorial slot", () => {
    expect(Object.keys(editorialPalette).sort()).toEqual([...slots].sort());
  });

  it("all values are valid hex colors", () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const value of Object.values(editorialPalette)) {
      expect(value).toMatch(hex);
    }
  });

  it("keeps the warm paper bg and deep-ink primary", () => {
    expect(editorialPalette.bg).toBe("#FAFAF6");
    expect(editorialPalette.primary).toBe("#0F172A");
  });
});
