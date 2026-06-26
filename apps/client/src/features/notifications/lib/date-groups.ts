/**
 * Bucket inbox items into date sections (Hoje / Esta semana / Antes) for the
 * grouped SectionList. Pure + deterministic (`now` injected) so it's unit
 * tested. Items are assumed to arrive newest-first from the backend; ordering
 * within each bucket is preserved.
 */

import type { NotificationItem } from "../types";

export type NotificationSectionKey = "today" | "thisWeek" | "earlier";

export type NotificationSection = {
  key: NotificationSectionKey;
  /** i18n key under `notifications.sections.*`. */
  titleKey: string;
  data: NotificationItem[];
};

const DAY_MS = 86_400_000;

/** Start-of-day (local) for a timestamp, in epoch ms. */
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function bucketFor(createdAt: string, now: number): NotificationSectionKey {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return "earlier";
  const todayStart = startOfDay(now);
  if (then >= todayStart) return "today";
  if (then >= todayStart - 6 * DAY_MS) return "thisWeek";
  return "earlier";
}

/** Group items into ordered, non-empty sections. */
export function groupByDate(
  items: readonly NotificationItem[],
  now: number,
): NotificationSection[] {
  const buckets: Record<NotificationSectionKey, NotificationItem[]> = {
    today: [],
    thisWeek: [],
    earlier: [],
  };
  for (const item of items) buckets[bucketFor(item.createdAt, now)].push(item);

  const order: NotificationSectionKey[] = ["today", "thisWeek", "earlier"];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, titleKey: `notifications.sections.${key}`, data: buckets[key] }));
}
