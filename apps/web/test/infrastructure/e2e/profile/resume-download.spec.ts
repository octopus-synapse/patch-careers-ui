import { expect, test } from '@playwright/test';
import { API_URL, STANDARD_USER_CREDENTIALS } from '../_helpers/auth';

/**
 * Resume PDF download — exercises `/api/v1/export/user/:userId/resume/pdf`.
 *
 * Backend's `OwnershipGuard` (entity='user', paramKey='userId') requires
 * `ctx.user.userId === requestedUserId`. Owner-positive tests log in
 * AS enzo and request enzo's PDF. The cross-user 403 case lives in its
 * own dedicated negative test below — same JWT, asks for a *different*
 * user's resource and asserts 403, not 200.
 */

let enzoAccessToken: string;
let enzoSessionCookie: string;
let enzoUserId: string;

test.describe.configure({ mode: 'serial' });

test.describe('Resume PDF Download', () => {
  test.beforeAll(async () => {
    const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(STANDARD_USER_CREDENTIALS),
    });
    if (!loginRes.ok) {
      throw new Error(`login as enzo failed: ${loginRes.status} ${await loginRes.text()}`);
    }
    const loginBody = (await loginRes.json()) as { accessToken?: string };
    enzoAccessToken = loginBody.accessToken ?? '';

    const setCookie = loginRes.headers.get('set-cookie') ?? '';
    enzoSessionCookie = setCookie.match(/access_token=([^;]+)/)?.[1] ?? '';

    // Login response doesn't carry `user.id`; resolve it via the public
    // profile endpoint, which is what the rest of the suite already does.
    const profileRes = await fetch(`${API_URL}/api/v1/profiles/enzoferracini`);
    const profileData = (await profileRes.json()) as { user?: { id?: string }; id?: string };
    enzoUserId = profileData?.user?.id ?? profileData?.id ?? '';
    if (!enzoUserId) throw new Error('failed to resolve enzo userId from public profile');
  });

  test('public profile endpoint returns user data with id', async () => {
    const profileRes = await fetch(`${API_URL}/api/v1/profiles/enzoferracini`);
    const profileData = (await profileRes.json()) as { user?: { id?: string }; id?: string };
    const idFromProfile = profileData?.user?.id ?? profileData?.id;
    expect(idFromProfile).toBeTruthy();
    expect(idFromProfile).toBe(enzoUserId);
  });

  test('download endpoint returns 401 without auth', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${enzoUserId}/resume/pdf`);
    expect(res.status).toBe(401);
  });

  test('download endpoint returns PDF data with JWT auth', async () => {
    // The login endpoint does not echo the JWT in the response body — it ships
    // it as the `access_token` HttpOnly cookie. The cookie value IS the JWT,
    // so we send it as a Bearer token to exercise the JWT-header auth path.
    // Response is the flat `{pdf, filename}` shape — no `{success, data}` envelope.
    const res = await fetch(`${API_URL}/api/v1/export/user/${enzoUserId}/resume/pdf`, {
      headers: { Authorization: `Bearer ${enzoSessionCookie}` },
    });
    const body = (await res.json()) as { pdf?: string; filename?: string };

    expect(res.status).toBe(200);
    expect(body.pdf).toBeTruthy();
    expect(body.filename).toBe('resume.pdf');
  });

  test('generated PDF must be exactly 1 page', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${enzoUserId}/resume/pdf`, {
      headers: { Authorization: `Bearer ${enzoSessionCookie}` },
    });
    const body = (await res.json()) as { pdf?: string };
    const pdfBase64 = body.pdf as string;
    expect(pdfBase64).toBeTruthy();

    const pdfText = atob(pdfBase64);
    const pageMatches = pdfText.match(/\/Type\s*\/Page(?!s)/g);
    const pageCount = pageMatches?.length ?? 0;

    expect(pageCount).toBe(1);
  });

  test('download endpoint returns PDF data with session cookie', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${enzoUserId}/resume/pdf`, {
      headers: { Cookie: `access_token=${enzoSessionCookie}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { pdf?: string };
    expect(body.pdf).toBeTruthy();
  });

  test('OwnershipGuard rejects cross-user PDF export with 403', async () => {
    // Negative case: enzo's JWT asking for the e2e-test user's PDF. The seeded
    // username is `e2e-test-user` (see prisma/seed.ts) — the profile-services
    // public-profile lookup is by username slug.
    const profileRes = await fetch(`${API_URL}/api/v1/profiles/e2e-test-user`);
    const profileData = (await profileRes.json()) as { user?: { id?: string }; id?: string };
    const e2eUserId = profileData?.user?.id ?? profileData?.id ?? '';
    if (!e2eUserId) {
      test.skip(true, 'public profile for e2e-test-user not available — seed may be stale');
    }
    expect(e2eUserId).not.toBe(enzoUserId);

    const res = await fetch(`${API_URL}/api/v1/export/user/${e2eUserId}/resume/pdf`, {
      headers: { Authorization: `Bearer ${enzoSessionCookie}` },
    });
    expect(res.status).toBe(403);
  });

  test('browser download button works on profile page', async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addCookies([
      {
        name: 'access_token',
        value: enzoSessionCookie,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await ctx.newPage();

    const consoleMessages: string[] = [];
    page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));

    const failedRequests: string[] = [];
    page.on('requestfailed', (req) =>
      failedRequests.push(`${req.url()} - ${req.failure()?.errorText}`),
    );

    await page.goto('/my-profile/public/@enzoferracini', { waitUntil: 'networkidle' });

    const downloadBtn = page.locator('button', { hasText: 'Download' });
    const btnVisible = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (!btnVisible) {
      console.log(
        'Download button not visible. Console:',
        consoleMessages.filter((m) => m.includes('error') || m.includes('Error')),
      );
      console.log('Failed requests:', failedRequests);
    }

    expect(btnVisible).toBe(true);

    await downloadBtn.click();
    await page.waitForTimeout(5000);

    const errorText = await page
      .locator('text=Failed')
      .isVisible()
      .catch(() => false);
    if (errorText) {
      console.log(
        'Download error visible. Console errors:',
        consoleMessages.filter((m) => m.includes('error') || m.includes('Error')),
      );
    }

    expect(errorText).toBe(false);

    await ctx.close();
  });
});
