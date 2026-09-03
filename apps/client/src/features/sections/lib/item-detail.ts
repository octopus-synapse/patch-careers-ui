/**
 * Splits a saved section item into the slots an expanded card renders.
 *
 * `itemCardParts` already existed but is lossy on purpose: it collapses an
 * item into `{ primary, meta }` for a two-line row. The desktop profile shows
 * items open — role, company, dates, description and achievements each in
 * their own place — so it needs the pieces, not the summary.
 *
 * There is no typed accessor for an item: `content` is `Record<string,
 * unknown>` from the API. What IS typed is `descriptor.fields`, the backend's
 * field list, already localised and already ordered by importance. So the
 * shape is read by zipping the fields against the content rather than by
 * knowing what a "work experience" looks like — which is what lets one
 * renderer serve all eighteen section types.
 *
 * Two things the field list will not tell you, both learned the hard way:
 *
 * 1. `achievements` is not in it. `fieldsFromDefinition` drops `array` and
 *    `object` fields (asserted in `section-definition.spec.ts`), so the array
 *    has to be read straight off `content`.
 * 2. An empty `endDate` is not missing data — it means "still there". The
 *    section form exempts it from its own required gate for exactly that
 *    reason (`GATE_EXEMPT_KEYS`), so an absent end renders as "Present".
 */

import { type EnumName, labelFor } from "@patch-careers/api-client";
import type { Locale } from "@patch-careers/i18n";
import type { SectionField, SectionItem } from "../types";
import { DATE_LIKE, monthLabel, parseYearMonth, stringifyValue } from "./helpers";

export type ItemDetail = {
  /** The headline — first plain text value (role, institution, name). */
  title: string;
  /** What is left of the short values, joined: company, degree · status, … */
  subtitle: string;
  /** "Mar 2022 — Jun 2024", or "Mar 2022 — Presente". Null when undated. */
  dateRange: string | null;
  /** Long-form prose, when the section has a textarea field. */
  description: string | null;
  /** Read off `content`, because the field list never carries it. */
  achievements: string[];
};

const START_KEY = /start/i;
const END_KEY = /end/i;

function isDateField(field: SectionField, value: string): boolean {
  return field.type === "date" || DATE_LIKE.test(value);
}

function isProse(field: SectionField): boolean {
  return field.widget === "textarea" || field.type === "textarea";
}

/** Enum values are stored SCREAMING_CASE; the dictionary has the display form. */
function display(field: SectionField, value: string, locale: Locale): string {
  if (!field.enumName) return value;
  return labelFor(field.enumName as EnumName, value, locale);
}

function formatDate(value: string, locale: Locale): string {
  const parsed = parseYearMonth(value);
  if (!parsed) return value;
  return monthLabel(parsed.year, parsed.month, locale, { month: "short", year: "numeric" });
}

/**
 * Achievements come back either as plain strings or as objects with a text
 * field, depending on how the item was written. Neither shape is guaranteed by
 * a type, so both are accepted and anything else is dropped.
 */
function readAchievements(content: Record<string, unknown> | undefined): string[] {
  const raw = content?.achievements;
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      const text = entry.trim();
      if (text) out.push(text);
      continue;
    }
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const text = stringifyValue(record.text ?? record.description ?? record.title).trim();
      if (text) out.push(text);
    }
  }
  return out;
}

export function itemDetail(
  item: SectionItem,
  fields: SectionField[] | undefined,
  locale: Locale,
  /** Localised "Presente"/"Present" — passed in so this module stays i18n-free. */
  presentLabel: string,
): ItemDetail {
  const content = item.content ?? {};
  const texts: string[] = [];
  const dates: string[] = [];
  let description: string | null = null;
  let start: string | null = null;
  let end: string | null = null;
  let hasEndField = false;

  for (const field of fields ?? []) {
    const value = stringifyValue(content[field.key]).trim();

    // An end field that EXISTS but is empty is the "Present" signal, so it has
    // to be noticed before empty values are skipped.
    if (END_KEY.test(field.key) && field.type === "date") hasEndField = true;
    if (!value) continue;

    if (isDateField(field, value)) {
      const formatted = formatDate(value, locale);
      if (START_KEY.test(field.key)) start = formatted;
      else if (END_KEY.test(field.key)) end = formatted;
      else dates.push(formatted);
      continue;
    }

    if (isProse(field)) {
      if (description === null) description = value;
      else texts.push(display(field, value, locale));
      continue;
    }

    texts.push(display(field, value, locale));
  }

  let dateRange: string | null = null;
  if (start && end) dateRange = `${start} — ${end}`;
  else if (start && hasEndField) dateRange = `${start} — ${presentLabel}`;
  else if (start) dateRange = start;
  else if (end) dateRange = end;
  else if (dates.length > 0) dateRange = dates.join(" · ");

  return {
    title: texts[0] ?? "",
    subtitle: texts.slice(1).join(" · "),
    dateRange,
    description,
    achievements: readAchievements(content),
  };
}
