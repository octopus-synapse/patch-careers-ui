/**
 * Versions sent with the signup consent payload. Backend rejects with
 * CONSENT_VERSION_MISMATCH if these don't match the live published
 * versions (currently 1.0.0 semver). Shared by the sign-up screen and
 * the unified auth dialog so a version bump happens in one place.
 */
export const TOS_VERSION = "1.0.0";
export const PRIVACY_VERSION = "1.0.0";
