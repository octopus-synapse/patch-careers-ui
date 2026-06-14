import type { Locale, Translator } from "@patch-careers/i18n";

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
export function editedAgo(
  dateStr: string | null | undefined,
  t: Translator,
  locale: Locale = "pt-BR",
  now: number = Date.now(),
): string {
  if (!dateStr) return "";
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.floor((now - then) / 60_000);
  if (mins < 1) return t("resumes.time.justNow");
  if (mins < 60) return t("resumes.time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("resumes.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 30)
    return days === 1 ? t("resumes.time.dayAgo") : t("resumes.time.daysAgo", { count: days });
  return new Date(then).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
