/**
 * Pure helpers shared by auth UI flows. Kept framework-free so they
 * can be unit-tested without booting React Native — JSX wrappers live
 * in `apps/app/app/(auth)/*` and consume these.
 */

/**
 * Masks an email for display in verification flows — keeps the first
 * char and the domain visible while hiding the rest of the local part.
 *
 *   `alice@gmail.com`        → `a****@gmail.com`
 *   `a@gmail.com`            → `a@gmail.com` (already minimal)
 *   `foo.bar@sub.example.com → `f******@sub.example.com`
 */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return email;
  const visibleHead = local[0] ?? "";
  const hiddenLen = Math.max(1, local.length - 1);
  return `${visibleHead}${"*".repeat(hiddenLen)}${domain}`;
}

/**
 * Very small RFC-ish email check. Sufficient for client-side gating —
 * the backend re-validates with its own (more permissive) rules. Keeps
 * the regex intentionally simple to avoid catastrophic backtracking.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  // local@domain.tld — no spaces, exactly one @, at least one dot in domain
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Parses a universal-link query string for a single-use reset / verify
 * token. Accepts both `?token=...` and the rarer `#token=...` fragment
 * form. Returns `null` when the param is missing or empty.
 */
export function extractToken(rawUrl: string, paramName = "token"): string | null {
  // Try fragment first (`#token=...`) — some providers emit it there
  // so they don't leak into server access logs.
  const hashIdx = rawUrl.indexOf("#");
  if (hashIdx >= 0) {
    const fragment = rawUrl.slice(hashIdx + 1);
    const fragParams = new URLSearchParams(fragment);
    const fromFrag = fragParams.get(paramName);
    if (fromFrag && fromFrag.length > 0) return fromFrag;
  }
  try {
    const parsed = new URL(rawUrl);
    const value = parsed.searchParams.get(paramName);
    return value && value.length > 0 ? value : null;
  } catch {
    // Not a fully-qualified URL — try to parse as raw query string.
    const queryIdx = rawUrl.indexOf("?");
    if (queryIdx < 0) return null;
    const params = new URLSearchParams(rawUrl.slice(queryIdx + 1));
    const value = params.get(paramName);
    return value && value.length > 0 ? value : null;
  }
}

/**
 * Computes the seconds remaining on a resend cooldown given the moment
 * the user last requested a resend. Returns 0 when the window is
 * exhausted. Pure so the UI can hold the `lastRequestedAt` timestamp
 * in state and re-derive the remaining seconds on every tick without
 * any side effects.
 */
export function cooldownSecondsRemaining(
  lastRequestedAt: number | null,
  cooldownSeconds: number,
  now: number = Date.now(),
): number {
  if (lastRequestedAt === null) return 0;
  const elapsed = Math.floor((now - lastRequestedAt) / 1000);
  const remaining = cooldownSeconds - elapsed;
  return remaining > 0 ? remaining : 0;
}
