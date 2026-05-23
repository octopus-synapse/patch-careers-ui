/**
 * Locale-aware formatters built on the platform `Intl` API.
 * No runtime polyfills — Hermes (>= RN 0.74) and modern browsers cover all of
 * the surfaces below. On older engines, install `@formatjs/intl-*` polyfills
 * at the consumer.
 */

import type { Locale } from "./types";

export function formatDate(
  value: Date | number | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
): string {
  return new Intl.NumberFormat(locale, {
    ...options,
    style: "currency",
    currency,
  }).format(value);
}

const SIZE_UNITS = ["B", "kB", "MB", "GB", "TB"] as const;

/**
 * Formats bytes in IEC-ish kilobyte (1000) with the locale-aware numeric
 * separator. We pick kilobytes (1000) over kibibytes (1024) to match the
 * convention surfaced to end users in upload limits.
 */
export function formatFileSize(bytes: number, locale: Locale, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return `${new Intl.NumberFormat(locale).format(0)} B`;
  }
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  const unit = SIZE_UNITS[unitIndex] ?? "B";
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unitIndex === 0 ? 0 : fractionDigits,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(value)} ${unit}`;
}

/**
 * Relative time between `from` and `to` (defaults to now), expressed in
 * the largest unit that yields |Δ| >= 1.
 */
export function formatRelativeTime(
  from: Date | number,
  locale: Locale,
  to: Date | number = Date.now(),
  options?: Intl.RelativeTimeFormatOptions,
): string {
  const fromMs = from instanceof Date ? from.getTime() : from;
  const toMs = to instanceof Date ? to.getTime() : to;
  const diffSec = (fromMs - toMs) / 1000;

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", ...options });
  for (const { unit, seconds } of units) {
    if (Math.abs(diffSec) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSec / seconds), unit);
    }
  }
  return formatter.format(0, "second");
}
