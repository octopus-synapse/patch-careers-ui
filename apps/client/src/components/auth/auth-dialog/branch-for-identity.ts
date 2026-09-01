/**
 * Maps the `POST /v1/auth/identify` routing signals to the step the
 * unified auth dialog should render next. Pure — the dialog owns the
 * presentation, this owns the decision:
 *
 * - unknown e-mail            → sign-up (create-password step);
 * - account without password  → OAuth-only notice (a password field
 *   would be a wall the user can never climb);
 * - otherwise                 → sign-in (password step). An unverified
 *   account still goes here: after login, `getAuthenticatedRoute`
 *   resumes the e-mail verification flow on its own.
 */

export interface IdentitySignals {
  exists: boolean;
  emailVerified?: boolean | undefined;
  hasPassword?: boolean | undefined;
}

export type AuthBranch = "signUp" | "signIn" | "oauthOnly";

export function branchForIdentity(signals: IdentitySignals): AuthBranch {
  if (!signals.exists) return "signUp";
  if (signals.hasPassword === false) return "oauthOnly";
  return "signIn";
}
