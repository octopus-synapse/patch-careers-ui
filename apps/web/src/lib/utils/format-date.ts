// Local convenience wrappers around `Intl.DateTimeFormat`. Callers
// should never reach for `new Date(x).toLocaleDateString()` directly —
// that bypasses locale fallback rules and produces inconsistent output
// when the user flips between pt-BR / en mid-session.
//
// P2-#55: relative-time formatting delegates to
// `packages/i18n/formatRelativeTime` so we don't keep two competing
// threshold tables — the previous local copy disagreed with the
// shared one (30-day "day" cap here vs. 7-day "week" bucket there).

import type { Locale } from 'i18n';
import { formatRelativeTime as sharedFormatRelativeTime } from 'i18n';

type Style = 'short' | 'long' | 'time' | 'datetime' | 'relative';

function toDate(input: Date | string | number | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeLocale(locale: string | undefined | null): Locale {
  return (locale && locale.length > 0 ? locale : 'pt-BR') as Locale;
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
  return sharedFormatRelativeTime(d, normalizeLocale(locale));
}
