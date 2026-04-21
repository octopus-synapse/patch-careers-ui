/**
 * Canonical LGPD consent versions.
 *
 * Bump here whenever the wording of Terms or Privacy Policy changes — every
 * user signed to a previous version will be forced to re-accept before any
 * protected API call succeeds (enforced by ConsentGuard on the backend).
 *
 * Keep in sync with backend env vars `TOS_VERSION` and `PRIVACY_POLICY_VERSION`.
 */
export const TOS_VERSION = '1.0.0';
export const PRIVACY_VERSION = '1.0.0';
export const LEGAL_EFFECTIVE_DATE = '2026-04-20';
