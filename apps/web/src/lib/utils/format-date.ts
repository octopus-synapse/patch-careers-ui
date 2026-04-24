// Single entry point for all date formatting in the app. Callers should never
// reach for `new Date(x).toLocaleDateString()` directly — that bypasses locale
// fallback rules and produces inconsistent output when the user flips between
// pt-BR / en mid-session.

type Style = 'short' | 'long' | 'time' | 'datetime' | 'relative';

const RELATIVE_THRESHOLDS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 30],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
];

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeLocale(locale: string | undefined | null): string {
  return locale && locale.length > 0 ? locale : 'pt-BR';
}

export function formatDate(
  input: Date | string | number | null | undefined,
  locale: string | undefined,
  style: Style = 'short',
): string {
  const d = toDate(input);
  if (!d) return '';
  const loc = normalizeLocale(locale);

  if (style === 'relative') {
    return formatRelative(d, loc);
  }

  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'time'
        ? { hour: '2-digit', minute: '2-digit' }
        : style === 'datetime'
          ? {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          : { day: '2-digit', month: '2-digit', year: 'numeric' };

  return new Intl.DateTimeFormat(loc, options).format(d);
}

export function formatRelative(
  input: Date | string | number | null | undefined,
  locale: string | undefined,
): string {
  const d = toDate(input);
  if (!d) return '';
  const loc = normalizeLocale(locale);
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto', style: 'long' });

  let diff = (d.getTime() - Date.now()) / 1000;
  for (const [unit, factor] of RELATIVE_THRESHOLDS) {
    if (Math.abs(diff) < factor) {
      return rtf.format(Math.round(diff), unit);
    }
    diff /= factor;
  }
  return rtf.format(Math.round(diff), 'year');
}
