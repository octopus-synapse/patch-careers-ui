/**
 * Compact "time ago" label for the notification inbox (agora / 5m / 3h / 2d),
 * falling back to a short date once older than a week. Hand-rolled because
 * Hermes ships without Intl.RelativeTimeFormat; templates come from i18n.
 *
 * Kept free of React/Tamagui so the branching is unit-testable; `now` is always
 * injected so the helper stays deterministic.
 */

import type { Translator } from "@patch-careers/i18n";

export function timeAgo(dateStr: string | null | undefined, now: number, t: Translator): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return t("notifications.timeAgo.now");
  if (mins < 60) return t("notifications.timeAgo.minutes", { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notifications.timeAgo.hours", { n: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("notifications.timeAgo.days", { n: days });
  return new Date(then).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
