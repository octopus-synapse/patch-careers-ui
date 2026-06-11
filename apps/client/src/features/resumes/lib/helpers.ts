import type { Locale } from "@patch-careers/i18n";

/**
 * Map a resume's content `language` (Prisma stores "pt-br" lowercase, plus
 * "en") to a supported i18n `Locale` ("pt-BR" | "en"). Used to localize the
 * section-type catalog by the DOCUMENT's language rather than the device UI
 * locale — a Portuguese resume shows Portuguese section names even on an
 * English phone.
 */
export function resumeLanguageToLocale(language: string | null | undefined): Locale | undefined {
  if (!language) return undefined;
  const normalized = language.trim().toLowerCase();
  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("en")) return "en";
  return undefined;
}

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
