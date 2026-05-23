import { describe, expect, it } from "vitest";
import { intent } from "./colors";
import { themeDark, themeLight, themes } from "./themes";

describe("themeLight", () => {
  it("is named 'light' and uses light intent variants", () => {
    expect(themeLight.name).toBe("light");
    expect(themeLight.colors.accent).toBe(intent.accent.light);
    expect(themeLight.colors.danger).toBe(intent.danger.light);
  });
});

describe("themeDark", () => {
  it("is named 'dark' and uses dark intent variants", () => {
    expect(themeDark.name).toBe("dark");
    expect(themeDark.colors.accent).toBe(intent.accent.dark);
    expect(themeDark.colors.danger).toBe(intent.danger.dark);
  });

  it("differs from themeLight on at least one color slot", () => {
    expect(themeDark.colors.neutral.bg).not.toBe(themeLight.colors.neutral.bg);
  });
});

describe("themes registry", () => {
  it("exposes both light and dark", () => {
    expect(themes.light).toBe(themeLight);
    expect(themes.dark).toBe(themeDark);
  });
});
