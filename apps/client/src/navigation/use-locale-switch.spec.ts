import { describe, expect, it } from "vitest";
import { twinPath } from "./twin-path";

describe("twinPath", () => {
  it("prefixes public pages when switching to english", () => {
    expect(twinPath("/", "en", "")).toBe("/en");
    expect(twinPath("/sign-in", "en", "")).toBe("/en/sign-in");
    expect(twinPath("/reset-password", "en", "?token=abc")).toBe("/en/reset-password?token=abc");
  });

  it("strips the prefix when switching to pt-BR", () => {
    expect(twinPath("/en", "pt-BR", "")).toBe("/");
    expect(twinPath("/en/sign-up", "pt-BR", "")).toBe("/sign-up");
    expect(twinPath("/en/reset-password", "pt-BR", "?token=abc")).toBe("/reset-password?token=abc");
  });

  it("is a no-op path-wise when the tree already matches", () => {
    expect(twinPath("/en/sign-in", "en", "")).toBe("/en/sign-in");
    expect(twinPath("/sign-in", "pt-BR", "")).toBe("/sign-in");
  });
});
