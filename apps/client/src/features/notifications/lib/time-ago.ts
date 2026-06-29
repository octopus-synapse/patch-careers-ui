/**
 * Compact "time ago" label for the notification inbox (agora / 5m / 3h / 2d).
 * Thin wrapper over the shared `@/lib/time-ago` helper with this feature's i18n
 * namespace — see that module for why it is hand-rolled (Hermes lacks
 * `Intl.RelativeTimeFormat`).
 */

import type { Translator } from "@patch-careers/i18n";
import { timeAgo as sharedTimeAgo } from "@/lib/time-ago";

export function timeAgo(dateStr: string | null | undefined, now: number, t: Translator): string {
  return sharedTimeAgo(dateStr, now, t, "notifications.timeAgo");
}
