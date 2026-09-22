import { describe, expect, it } from "vitest";
import { twinPath } from "./twin-path";

describe("twinPath", () => {
  it("prefixes every page when switching to english", () => {
    expect(twinPath("/", "en", "")).toBe("/en");
    expect(twinPath("/auth", "en", "")).toBe("/en/auth");
    expect(twinPath("/reset-password", "en", "?token=abc")).toBe("/en/reset-password?token=abc");
    expect(twinPath("/jobs", "en", "?scope=applications")).toBe("/en/jobs?scope=applications");
    expect(twinPath("/settings/preferences", "en", "", "#language")).toBe(
      "/en/settings/preferences#language",
    );
  });

  it("strips the prefix when switching to pt-BR", () => {
    expect(twinPath("/en", "pt-BR", "")).toBe("/");
    expect(twinPath("/en/auth", "pt-BR", "")).toBe("/auth");
    expect(twinPath("/en/reset-password", "pt-BR", "?token=abc")).toBe("/reset-password?token=abc");
  });

  it("is a no-op path-wise when the tree already matches", () => {
    expect(twinPath("/en/auth", "en", "")).toBe("/en/auth");
    expect(twinPath("/auth", "pt-BR", "")).toBe("/auth");
  });

  it("keeps authenticated app routes in the requested language", () => {
    expect(twinPath("/en/jobs", "en", "?scope=applications")).toBe("/en/jobs?scope=applications");
    expect(twinPath("/en/settings", "en", "")).toBe("/en/settings");
    expect(twinPath("/en/jobs", "pt-BR", "")).toBe("/jobs");
  });
});
