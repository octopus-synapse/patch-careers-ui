import { type EnumName, labelFor } from "@patch-careers/api-client";
import { formatDate, type Locale } from "@patch-careers/i18n";
import type { SectionField, SectionItem } from "../types";

const DATE_LIKE = /^\d{4}-\d{2}(-\d{2})?$/;

/** Localize saved content for a card: enum fields render their dictionary
 *  label (the stored value is SCREAMING_CASE), everything else stays as-is.
 *  When `fields` is given the card shows only those visible fields, in order
 *  (so hidden/derived keys like companyDomain don't leak); without it, falls
 *  back to the raw content values. */
function displayEntries(item: SectionItem, locale: Locale, fields?: SectionField[]): string[] {
  const content = item.content ?? {};
  const enumByKey = new Map<string, string>();
  for (const f of fields ?? []) if (f.enumName) enumByKey.set(f.key, f.enumName);
  const entries: Array<[string, unknown]> = fields
    ? fields.map((f) => [f.key, content[f.key]])
    : Object.entries(content);
  const out: string[] = [];
  for (const [key, raw] of entries) {
    const value = stringifyValue(raw).trim();
    if (!value) continue;
    const enumName = enumByKey.get(key);
    out.push(enumName ? labelFor(enumName as EnumName, value, locale) : value);
  }
  return out;
}

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
export function itemSummary(
  item: SectionItem,
  locale: Locale = "en",
  fields?: SectionField[],
): string {
  if (!item.content) return "---";
  const values = displayEntries(item, locale, fields);
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
  fields?: SectionField[],
): { primary: string; meta: string } {
  const values = displayEntries(item, locale, fields);
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

/**
 * Map a MEC course `grau` to the education `degreeType` enum value.
 * MEC only catalogs graduação: Tecnológico maps to Technical; Bacharelado /
 * Licenciatura / ABI are bachelor-level. Anything unrecognized returns null
 * so the field stays for the user to pick.
 */
export function degreeTypeFromGrau(grau: string | null): string | null {
  if (!grau) return null;
  // Canonical DegreeType values (match the seed enum + ENUM_DICTIONARY).
  if (/tecn[oó]l/i.test(grau)) return "TECHNICAL";
  if (/bacharel|licenciatura|área básica|abi/i.test(grau)) return "BACHELOR";
  return null;
}

// MEC catalogs total workload in hours, not semesters; ~400h per semester is
// the usual full-time pace (3200h bacharelado → 8 semesters).
const HOURS_PER_SEMESTER = 400;
const MAX_SEMESTERS = 14;

/**
 * Suggest a graduation date from the MEC course workload: convert hours to
 * semesters, then walk Brazilian academic halves (Jan–Jun / Jul–Dec) from the
 * start date — Feb 2025 + 8 semesters lands on Dec 2028, Aug 2025 on Jun 2029.
 * Returns null when either input can't produce a sensible suggestion.
 */
export function suggestEndDateFromWorkload(
  startDate: string,
  cargaHoraria: number | null,
): string | null {
  const start = parseYearMonth(startDate);
  if (!start || !cargaHoraria || cargaHoraria <= 0) return null;
  const semesters = Math.min(
    MAX_SEMESTERS,
    Math.max(1, Math.round(cargaHoraria / HOURS_PER_SEMESTER)),
  );
  const startHalf = start.month <= 6 ? 0 : 1;
  const endHalfIndex = start.year * 2 + startHalf + semesters - 1;
  const endYear = Math.floor(endHalfIndex / 2);
  const endMonth = endHalfIndex % 2 === 0 ? 6 : 12;
  return `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
}
