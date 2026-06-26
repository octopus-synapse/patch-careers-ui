import { describe, expect, it } from "vitest";
import type { NotificationItem } from "../types";
import { groupByDate } from "./date-groups";

const NOW = new Date("2026-06-11T12:00:00Z").getTime();

function item(id: string, createdAt: string): NotificationItem {
  return { id, createdAt } as unknown as NotificationItem;
}

describe("groupByDate", () => {
  it("returns no sections for an empty list", () => {
    expect(groupByDate([], NOW)).toEqual([]);
  });

  it("buckets into today / thisWeek / earlier and drops empty sections", () => {
    const items = [
      item("a", "2026-06-11T09:00:00Z"), // today
      item("b", "2026-06-09T09:00:00Z"), // this week
      item("c", "2026-05-01T09:00:00Z"), // earlier
    ];
    const sections = groupByDate(items, NOW);
    expect(sections.map((s) => s.key)).toEqual(["today", "thisWeek", "earlier"]);
    expect(sections.map((s) => s.titleKey)).toEqual([
      "notifications.sections.today",
      "notifications.sections.thisWeek",
      "notifications.sections.earlier",
    ]);
    expect(sections[0]?.data.map((i) => i.id)).toEqual(["a"]);
  });

  it("omits sections that have no items", () => {
    const sections = groupByDate([item("a", "2026-06-11T08:00:00Z")], NOW);
    expect(sections).toHaveLength(1);
    expect(sections[0]?.key).toBe("today");
  });

  it("preserves input order within a bucket", () => {
    const items = [item("a", "2026-06-11T11:00:00Z"), item("b", "2026-06-11T10:00:00Z")];
    expect(groupByDate(items, NOW)[0]?.data.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("treats invalid dates as earlier", () => {
    expect(groupByDate([item("x", "nope")], NOW)[0]?.key).toBe("earlier");
  });
});
