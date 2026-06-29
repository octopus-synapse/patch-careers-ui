/**
 * Shared compact "time ago" label (agora / 5m / 3h / 2d), falling back to a
 * short date once older than a week. Hand-rolled on purpose: Hermes (Android)
 * ships without `Intl.RelativeTimeFormat`, so `formatRelativeTime` from
 * @patch-careers/i18n crashes RN components — every inbox surface uses this
 * instead.
 *
 * `keyPrefix` selects the i18n namespace (e.g. "messages.timeAgo" →
 * `messages.timeAgo.now` / `.minutes` / `.hours` / `.days`); `now` is injected
 * so the branching stays deterministic and unit-testable. Kept free of
 * React/Tamagui.
 */

import type { Translator } from "@patch-careers/i18n";

export function timeAgo(
  dateStr: string | null | undefined,
  now: number,
  t: Translator,
  keyPrefix: string,
): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return t(`${keyPrefix}.now`);
  if (mins < 60) return t(`${keyPrefix}.minutes`, { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t(`${keyPrefix}.hours`, { n: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t(`${keyPrefix}.days`, { n: days });
  return new Date(then).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
