import type { Translator } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { timeAgo } from "./time-ago";

// Echoes the resolved key (+ count) so each bucket is asserted precisely.
const t: Translator = (key, params) =>
  params && "n" in params ? `${key}:${(params as { n: number }).n}` : key;

const NOW = new Date("2026-06-29T12:00:00Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("timeAgo (shared)", () => {
  it("returns empty for missing or invalid dates", () => {
    expect(timeAgo(null, NOW, t, "x")).toBe("");
    expect(timeAgo(undefined, NOW, t, "x")).toBe("");
    expect(timeAgo("not-a-date", NOW, t, "x")).toBe("");
  });

  it("buckets sub-minute / minutes / hours / days under the i18n prefix", () => {
    expect(timeAgo(ago(30 * SEC), NOW, t, "messages.timeAgo")).toBe("messages.timeAgo.now");
    expect(timeAgo(ago(5 * MIN), NOW, t, "messages.timeAgo")).toBe("messages.timeAgo.minutes:5");
    expect(timeAgo(ago(3 * HOUR), NOW, t, "messages.timeAgo")).toBe("messages.timeAgo.hours:3");
    expect(timeAgo(ago(2 * DAY), NOW, t, "messages.timeAgo")).toBe("messages.timeAgo.days:2");
  });

  it("honours the prefix argument", () => {
    expect(timeAgo(ago(5 * MIN), NOW, t, "notifications.timeAgo")).toBe(
      "notifications.timeAgo.minutes:5",
    );
  });

  it("falls back to an absolute short date past a week", () => {
    const out = timeAgo(ago(10 * DAY), NOW, t, "messages.timeAgo");
    expect(out).not.toContain("timeAgo");
    expect(out.length).toBeGreaterThan(0);
  });
});
