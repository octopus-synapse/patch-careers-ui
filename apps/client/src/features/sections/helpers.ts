import { formatDate, type Locale } from "@patch-careers/i18n";
import type { SectionItem } from "./types";

const DATE_LIKE = /^\d{4}-\d{2}(-\d{2})?$/;

export function parseYearMonth(value: string): { month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { month, year };
}

// Build the date from local components so a date-only string can't shift a
// month across the UTC boundary when Intl formats it.
export function monthLabel(
  year: number,
  month: number,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions,
): string {
  return formatDate(new Date(year, month - 1, 1), locale, opts);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** Short "value · value · value" line used as a list-key and accessible summary. */
export function itemSummary(item: SectionItem): string {
  if (!item.content) return "---";
  const values = Object.values(item.content).map(stringifyValue).filter(Boolean);
  return values.slice(0, 3).join(" · ") || "---";
}

/**
 * Splits a saved section item into an editorial headline + a muted meta line.
 * The first text value is the headline (org/title/name — backend field order is
 * importance); the rest plus any localized dates form the meta. A start/end pair
 * collapses to a "Jan 2024 – Jun 2025" range.
 */
export function itemCardParts(
  item: SectionItem,
  locale: Locale,
): { primary: string; meta: string } {
  const values = Object.values(item.content ?? {})
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter(Boolean);
  const texts: string[] = [];
  const dates: string[] = [];
  for (const value of values) {
    if (DATE_LIKE.test(value)) {
      const parsed = parseYearMonth(value);
      dates.push(
        parsed
          ? monthLabel(parsed.year, parsed.month, locale, { month: "short", year: "numeric" })
          : value,
      );
    } else {
      texts.push(value);
    }
  }
  const hasText = texts.length > 0;
  const primary = (hasText ? texts[0] : dates[0]) ?? "—";
  const restTexts = hasText ? texts.slice(1) : [];
  const restDates = hasText ? dates : dates.slice(1);
  const dateSegment =
    restDates.length === 2 ? `${restDates[0]} – ${restDates[1]}` : restDates.join(" · ");
  const meta = [...restTexts, dateSegment].filter(Boolean).join("  ·  ");
  return { primary, meta };
}
