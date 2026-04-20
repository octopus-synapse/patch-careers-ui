import { formatRelativeTime } from 'i18n';
import { locale } from '$lib/locale.svelte';

/**
 * Single source of truth for "X minutes ago" rendering across the app.
 * Uses the shared `i18n` formatter so output is locale-aware (PT/EN) and
 * future server-side `humanRelative` interceptor responses stay consistent.
 *
 * Returns an empty string for null/undefined so callers can render
 * `{relativeFrom(date)}` without conditionals.
 *
 * Pass `nowMs` to thread a reactive "now" tick (e.g. from a 60s ticker store)
 * so the value re-derives as time passes instead of going stale on the wire
 * timestamp it was first computed against.
 */
export function relativeFrom(
  date: string | number | Date | null | undefined,
  nowMs?: number,
): string {
  if (!date) return '';
  // Touch nowMs so the derivation has it as a tracked dependency.
  void nowMs;
  return formatRelativeTime(date, locale.current);
}
