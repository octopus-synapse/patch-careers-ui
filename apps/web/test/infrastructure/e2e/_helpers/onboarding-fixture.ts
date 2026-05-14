import type { BrowserContext } from '@playwright/test';
import { API_URL, type TestLocale } from './auth';

/**
 * Reset the onboarding fixture user back to a clean starting state.
 *
 * Each spec under `auth/onboarding*.spec.ts` shares one `BrowserContext`
 * across all its tests for speed, but the backend persists step progress
 * AND field data per-user. A test that clicks `Continuar` mutates the
 * user's `OnboardingProgress` row; the next test would then enter the
 * stepper mid-flow with leftover data and its expectations would fail.
 *
 * Hits the public `POST /api/v1/onboarding/session/restart` endpoint —
 * the same endpoint the "Reset onboarding" button in production calls.
 * The restart use case wipes `OnboardingProgress` and re-seeds it from
 * the User's profile fields, leaving the user at the `personal-info`
 * step with `welcome` already in `completedSteps`. Field data is
 * cleared (the seeded e2e-onboarding user has no phone/location, only
 * a name) so tests that rely on empty-required-field state can trust
 * what they see.
 *
 * F.I.R.S.T. *Independent* + *Repeatable* satisfied via existing
 * production API — no test-only endpoint, no direct DB connection,
 * no postgres client dep in test infra.
 *
 * @example
 *   test.beforeEach(async () => {
 *     await resetOnboardingToWelcome(authContext);
 *   });
 */
export async function resetOnboardingToWelcome(
  ctx: BrowserContext,
  locale: TestLocale = 'pt-BR',
): Promise<void> {
  const cookies = await ctx.cookies();
  const accessToken = cookies.find((c) => c.name === 'access_token')?.value;
  if (!accessToken) {
    throw new Error('resetOnboardingToWelcome: no access_token cookie on the context');
  }

  // `mode=clean` wipes progress to a blank slate: currentStep=welcome,
  // completedSteps=[], no personalInfo/professionalProfile/sections.
  // (The default restart mode pre-fills from User row + carries forward
  // completed steps — useful UX, wrong for tests that assert empty state.)
  const restartRes = await fetch(
    `${API_URL}/api/v1/onboarding/session/restart?locale=${encodeURIComponent(locale)}&mode=clean`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `access_token=${accessToken}`,
      },
    },
  );
  if (!restartRes.ok) {
    throw new Error(
      `resetOnboardingToWelcome failed: ${restartRes.status} ${await restartRes.text().catch(() => '')}`,
    );
  }
}
