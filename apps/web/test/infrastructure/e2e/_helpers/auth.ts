import type { Browser, BrowserContext } from '@playwright/test';

export const API_URL = 'http://localhost:3001';

/** Seeded admin from `profile-services/prisma/seed.ts`. Owns every
 *  permission and bypasses standard-user onboarding guards. */
export const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!@#',
};

/** Seeded enzoferracini fixture user — a real standard user with a
 *  persisted resume. Good for resume-facing tests. */
export const STANDARD_USER_CREDENTIALS = {
  email: 'enzo@patchcareers.local',
  password: 'Enzo_Test_123!',
};

/** E2E fixture user from the backend seed (no resume). */
export const E2E_USER_CREDENTIALS = {
  email: 'e2e-test@profile.local',
  password: 'E2E_Test_Password_123!',
};

/**
 * POST /api/auth/login and return a Playwright BrowserContext with the
 * session cookie already installed. Prefer this over logging in through
 * the UI when the test isn't about the login flow itself — direct
 * cookie seeding is faster and more stable.
 */
export async function loginAs(
  browser: Browser,
  creds: { email: string; password: string },
): Promise<BrowserContext> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) {
    throw new Error(
      `login for ${creds.email} failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/session=([^;]+)/);
  if (!match) throw new Error(`no session cookie returned for ${creds.email}`);

  const ctx = await browser.newContext();
  await ctx.addCookies([
    {
      name: 'session',
      value: match[1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return ctx;
}

/** Same as `loginAs` but silently returns null when the creds are not
 *  accepted — lets a suite skip gracefully when the backend seed is
 *  out of date rather than cascading failures. */
export async function maybeLoginAs(
  browser: Browser,
  creds: { email: string; password: string },
): Promise<BrowserContext | null> {
  try {
    return await loginAs(browser, creds);
  } catch {
    return null;
  }
}
