/**
 * Maps the `POST /v1/auth/identify` routing signals to the step the
 * unified auth dialog should render next. Pure — the dialog owns the
 * presentation, this owns the decision:
 *
 * - unknown e-mail            → verification, then a new account;
 * - unverified account        → verification, then password on that account;
 * - account without password  → unavailable notice (a password field
 *   would be a wall the user can never climb);
 * - otherwise                 → sign-in (password step).
 */

export interface IdentitySignals {
  exists: boolean;
  emailVerified?: boolean | undefined;
  hasPassword?: boolean | undefined;
}

export type AuthBranch = "signUp" | "resumeUnverified" | "signIn" | "unavailable";

export function branchForIdentity(signals: IdentitySignals): AuthBranch {
  if (!signals.exists) return "signUp";
  if (signals.emailVerified === false) return "resumeUnverified";
  if (signals.hasPassword === false) return "unavailable";
  return "signIn";
}
