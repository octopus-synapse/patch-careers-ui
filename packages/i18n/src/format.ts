import type { Locale } from './config';

export function formatDate(
  date: Date | number | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

export function formatRelativeTime(
  date: Date | number | string,
  locale: Locale,
  options?: Intl.RelativeTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', ...options });

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (abs >= ms || unit === 'second') {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(0, 'second');
}
