/**
 * Shared polling cadences for React Query `refetchInterval`. Single source so
 * the inbox surfaces (notifications + messages) stay in lockstep when the
 * cadence is tuned.
 */

/** Inbox refresh interval (notifications + messages), in milliseconds. */
export const INBOX_POLL_MS = 30_000;
