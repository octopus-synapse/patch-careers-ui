import { describe, expect, it } from "vitest";
import { activeNavKey, isChromePath } from "./nav-routes";

describe("isChromePath", () => {
  it("keeps the app bar off the landing, which owns its own chrome", () => {
    expect(isChromePath("/")).toBe(false);
    expect(isChromePath("/en")).toBe(false);
  });

  it("keeps it off screens that own the full window", () => {
    for (const path of ["/sign-in", "/sign-up", "/onboarding", "/verify-email", "/legal-webview"]) {
      expect(isChromePath(path)).toBe(false);
      expect(isChromePath(`/en${path}`)).toBe(false);
    }
  });

  it("shows it on tab roots and on stacked details alike", () => {
    for (const path of ["/jobs", "/job/abc", "/messages", "/settings", "/notifications"]) {
      expect(isChromePath(path)).toBe(true);
      expect(isChromePath(`/en${path}`)).toBe(true);
    }
  });

  it("does not mistake a path that merely contains a chromeless word", () => {
    expect(isChromePath("/jobs/sign-in-tips")).toBe(true);
  });
});

describe("activeNavKey", () => {
  it("lights the section a stacked detail belongs to", () => {
    expect(activeNavKey("/job/abc")).toBe("jobs");
    expect(activeNavKey("/conversation/7")).toBe("messages");
    expect(activeNavKey("/resume/12")).toBe("curriculos");
    expect(activeNavKey("/profile")).toBe("profile");
  });

  it("reads the English twins the same way", () => {
    expect(activeNavKey("/en/jobs")).toBe("jobs");
    expect(activeNavKey("/en/messages")).toBe("messages");
  });

  it("still names notifications — the bell wears it now, not a tab", () => {
    expect(activeNavKey("/notifications")).toBe("notifications");
  });

  it("lights nothing on a screen outside the destinations", () => {
    expect(activeNavKey("/settings")).toBeNull();
    expect(activeNavKey("/")).toBeNull();
  });
});
