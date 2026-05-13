import type { Browser, BrowserContext } from '@playwright/test';

export const API_URL = 'http://localhost:3001';

/**
 * Shape returned by `POST /api/v1/accounts` after signup. The backend
 * returns the bare payload — historically there was a `{ data: ... }`
 * envelope and a few stragglers in the test tree still read it that
 * way. Funnel every test signup through `signupTestUser` so the next
 * shape change is a one-line edit.
 */
export type SignupResponse = {
  userId: string;
  email: string;
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

/** Required-but-rarely-varied scaffolding for `POST /api/v1/accounts`.
 *  Versions exist for the legal consent gates and aren't part of the
 *  feature under test — the helper sets sensible defaults. */
export async function signupTestUser(input: {
  name: string;
  email: string;
  password: string;
  acceptedTosVersion?: string;
  acceptedPrivacyVersion?: string;
}): Promise<SignupResponse> {
  const res = await fetch(`${API_URL}/api/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acceptedTosVersion: '1.0.0',
      acceptedPrivacyVersion: '1.0.0',
      ...input,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `signup for ${input.email} failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }
  return (await res.json()) as SignupResponse;
}

/** Shape returned by `GET /api/v1/auth/session`. Same rationale as
 *  `SignupResponse` — keep the shape in one place. */
export type SessionResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    username: string | null;
    hasCompletedOnboarding: boolean;
    emailVerified: boolean;
    role: string;
    roles: string[];
    isAdmin: boolean;
    needsOnboarding: boolean;
    needsEmailVerification: boolean;
  };
};

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

/** Locale used by tests that assert PT-BR copy. Playwright Chromium
 *  defaults to `en-US`, which would make `locale.init()` resolve to
 *  English; setting the cookie up front locks the dictionary so test
 *  assertions can rely on the literal copy without hedging the case. */
export type TestLocale = 'pt-BR' | 'en';
export const DEFAULT_TEST_LOCALE: TestLocale = 'pt-BR';

/**
 * POST /api/v1/auth/login and return a Playwright BrowserContext with the
 * session cookie already installed. Prefer this over logging in through
 * the UI when the test isn't about the login flow itself — direct
 * cookie seeding is faster and more stable.
 *
 * Also seeds the `locale` cookie that `locale.svelte.ts` consults first.
 * Default is pt-BR (the product's primary market); pass `locale: 'en'`
 * for tests that assert English-language copy.
 */
export async function loginAs(
  browser: Browser,
  creds: { email: string; password: string },
  opts: { locale?: TestLocale } = {},
): Promise<BrowserContext> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) {
    throw new Error(
      `login for ${creds.email} failed: ${res.status} ${await res.text().catch(() => '')}`,
    );
  }
  // Backend sets `access_token` (HttpOnly JWT cookie). Earlier this code
  // looked for a `session=` cookie which no longer exists — the JWT bearer
  // is what backend auth middleware actually reads.
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/access_token=([^;]+)/);
  if (!match) throw new Error(`no access_token cookie returned for ${creds.email}`);

  const ctx = await browser.newContext();
  await ctx.addCookies([
    {
      name: 'access_token',
      value: match[1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      // `locale` is read by `locale.svelte.ts` (cookie → dictionary)
      // and by `api-client`'s fetcher (cookie → Accept-Language). Not
      // httpOnly: the frontend script reads it via `document.cookie`.
      name: 'locale',
      value: opts.locale ?? DEFAULT_TEST_LOCALE,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);
  return ctx;
}

/** Seed only the locale cookie on a context — useful for tests that
 *  create their own context (signup-then-use flows where `loginAs`
 *  doesn't apply) but still need PT-BR copy to land. */
export async function seedLocaleCookie(
  ctx: BrowserContext,
  locale: TestLocale = DEFAULT_TEST_LOCALE,
): Promise<void> {
  await ctx.addCookies([
    {
      name: 'locale',
      value: locale,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);
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
