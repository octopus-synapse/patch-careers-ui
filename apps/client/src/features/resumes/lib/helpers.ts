/**
 * Dependency-free relative "edited ago" label. Deliberately NOT
 * Intl.RelativeTimeFormat (`formatRelativeTime` from @patch-careers/i18n):
 * Hermes on Android ships without it, crashing with "Cannot read property
 * 'prototype' of undefined" — same reason the messages feature hand-rolls
 * its `timeAgo`.
 */
export function editedAgo(dateStr: string | null | undefined, now: number = Date.now()): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return days === 1 ? "há 1 dia" : `há ${days} dias`;
  return new Date(then).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
