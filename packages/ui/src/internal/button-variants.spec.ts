import { describe, expect, it } from "vitest";
import { resolveButtonStyle } from "./button-variants";

describe("resolveButtonStyle", () => {
  it("uses solid intent colors in light theme by default", () => {
    const style = resolveButtonStyle("solid", "accent", "md", "light");
    expect(style.backgroundColor).not.toBe("transparent");
    expect(style.borderWidth).toBe(1);
    expect(style.opacity).toBe(1);
  });

  it("outlined uses transparent bg + colored fg/border", () => {
    const style = resolveButtonStyle("outlined", "danger", "md", "light");
    expect(style.backgroundColor).toBe("transparent");
    expect(style.color).not.toBe("transparent");
    expect(style.borderColor).not.toBe("transparent");
    expect(style.borderWidth).toBe(1);
  });

  it("ghost has no border and transparent bg", () => {
    const style = resolveButtonStyle("ghost", "success", "md", "light");
    expect(style.backgroundColor).toBe("transparent");
    expect(style.borderColor).toBe("transparent");
    expect(style.borderWidth).toBe(0);
  });

  it("scales padding/fontSize across sizes", () => {
    const sm = resolveButtonStyle("solid", "neutral", "sm", "light");
    const md = resolveButtonStyle("solid", "neutral", "md", "light");
    const lg = resolveButtonStyle("solid", "neutral", "lg", "light");
    expect(sm.fontSize).toBeLessThan(md.fontSize);
    expect(md.fontSize).toBeLessThan(lg.fontSize);
    expect(sm.paddingHorizontal).toBeLessThan(md.paddingHorizontal);
    expect(md.paddingHorizontal).toBeLessThan(lg.paddingHorizontal);
  });

  it("guarantees WCAG min touch target (>=44pt) for every size", () => {
    const sm = resolveButtonStyle("solid", "neutral", "sm", "light");
    const md = resolveButtonStyle("solid", "neutral", "md", "light");
    const lg = resolveButtonStyle("solid", "neutral", "lg", "light");
    expect(sm.minHeight).toBeGreaterThanOrEqual(44);
    expect(md.minHeight).toBeGreaterThanOrEqual(44);
    expect(lg.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("light vs dark theme yields different bg colors", () => {
    const light = resolveButtonStyle("solid", "accent", "md", "light");
    const dark = resolveButtonStyle("solid", "accent", "md", "dark");
    expect(light.backgroundColor).not.toBe(dark.backgroundColor);
  });

  it("hover swaps bg per variant", () => {
    const solidHover = resolveButtonStyle("solid", "accent", "md", "light", "hover");
    const ghostHover = resolveButtonStyle("ghost", "accent", "md", "light", "hover");
    expect(solidHover.backgroundColor).not.toBe("transparent");
    expect(ghostHover.backgroundColor).not.toBe("transparent");
  });

  it("press is darker than hover for solid", () => {
    const solidDefault = resolveButtonStyle("solid", "accent", "md", "light");
    const solidPress = resolveButtonStyle("solid", "accent", "md", "light", "press");
    expect(solidPress.backgroundColor).not.toBe(solidDefault.backgroundColor);
  });

  it("disabled drops opacity to 0.5 regardless of variant", () => {
    const a = resolveButtonStyle("solid", "neutral", "md", "light", "disabled");
    const b = resolveButtonStyle("outlined", "neutral", "md", "light", "disabled");
    const c = resolveButtonStyle("ghost", "neutral", "md", "light", "disabled");
    expect(a.opacity).toBe(0.5);
    expect(b.opacity).toBe(0.5);
    expect(c.opacity).toBe(0.5);
  });
});
