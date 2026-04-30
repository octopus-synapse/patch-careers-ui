import { randomUUID } from 'node:crypto';
import { type BrowserContext, expect, test } from '@playwright/test';
import { deleteMessagesFor, getLatestVerificationCode } from '../_helpers/mailpit';

/**
 * Pins the 3-stage gating contract:
 *   (1) signup      → forced to /identity/verify-email until email is verified
 *   (2) verified    → forced to /onboarding/start until onboarding completes
 *   (3) complete    → every app route + navbar item unlocks
 *
 * Requires the backend to run with `SKIP_EMAIL_VERIFICATION=false` — the
 * flag is now false in `profile-services/.env`, which is what this spec
 * is meant to protect against regression.
 */

const API_URL = 'http://localhost:3001';
const GATED_ROUTES = ['/my-profile/dashboard', '/social/feed', '/careers/browse-jobs'];

type User = { email: string; password: string; name: string; userId?: string };

async function signup(): Promise<User> {
  const id = randomUUID().slice(0, 8);
  const user: User = {
    email: `e2e-3stage-${id}@test.com`,
    password: 'T3stP@ssw0rd!',
    name: `E2E 3-stage ${id}`,
  };
  const res = await fetch(`${API_URL}/api/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      password: user.password,
      acceptedTosVersion: '1.0.0',
      acceptedPrivacyVersion: '1.0.0',
    }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: { userId: string } };
  user.userId = body.data.userId;
  return user;
}

async function loginCookie(user: User): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/session=([^;]+)/);
  if (!match) throw new Error(`no session cookie: status=${res.status} body=${await res.text()}`);
  return match[1];
}

async function ctxFor(
  user: User,
  browser: import('@playwright/test').Browser,
): Promise<BrowserContext> {
  const session = await loginCookie(user);
  const ctx = await browser.newContext();
  await ctx.addCookies([
    {
      name: 'session',
      value: session,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return ctx;
}

test.describe('3-stage gating — signup → verify → onboarding → app', () => {
  test('unverified user is pinned to /identity/verify-email and has no navbar items', async ({
    browser,
  }) => {
    const user = await signup();
    const ctx = await ctxFor(user, browser);
    const page = await ctx.newPage();

    await page.goto('/');
    await page.waitForURL(/identity\/verify-email/, { timeout: 10_000 });

    for (const route of GATED_ROUTES.concat(['/onboarding/start'])) {
      await page.goto(route);
      await page.waitForURL(/identity\/verify-email/, { timeout: 10_000 });
    }

    // Navbar shows ZERO app nav items while unverified.
    const appNavLabels = ['Feed', 'Vagas', 'Painel', 'Minha Rede'];
    for (const label of appNavLabels) {
      const link = page.getByRole('link', { name: label, exact: true });
      await expect(link, `nav item "${label}" must not render while unverified`).toHaveCount(0);
    }

    // Chat FAB ("Mensagens") must not render either — it points at endpoints
    // an unverified user can't call and encourages a dead-end interaction.
    await expect(
      page.getByRole('button', { name: /mensagens/i }),
      'chat FAB must be hidden while unverified',
    ).toHaveCount(0);

    await deleteMessagesFor(user.email);
    await ctx.close();
  });

  test('verified-but-not-onboarded user is pinned to /onboarding/start with empty navbar', async ({
    browser,
  }) => {
    const user = await signup();

    // Kick off the verification email so Mailpit has something to serve.
    const sessionCookie = await loginCookie(user);
    const sendRes = await fetch(`${API_URL}/api/email-verification/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: `session=${sessionCookie}` },
    });
    expect(sendRes.status, `send-verification failed: ${await sendRes.text()}`).toBe(200);

    const code = await getLatestVerificationCode(user.email);
    const verifyRes = await fetch(`${API_URL}/api/email-verification/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code }),
    });
    expect(verifyRes.status, `verify failed: ${await verifyRes.text()}`).toBe(200);

    const ctx = await ctxFor(user, browser);
    const page = await ctx.newPage();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/onboarding');

    for (const route of GATED_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(
        page.url(),
        `route ${route} should redirect to onboarding when not onboarded`,
      ).toContain('/onboarding');
    }

    const appNavLabels = ['Feed', 'Vagas', 'Painel', 'Minha Rede'];
    for (const label of appNavLabels) {
      const link = page.getByRole('link', { name: label, exact: true });
      await expect(
        link,
        `nav item "${label}" must not render while onboarding incomplete`,
      ).toHaveCount(0);
    }
    await expect(
      page.getByRole('button', { name: /mensagens/i }),
      'chat FAB must be hidden until onboarding is complete',
    ).toHaveCount(0);

    await deleteMessagesFor(user.email);
    await ctx.close();
  });
});
