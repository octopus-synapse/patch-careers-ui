import { expect, test } from '@playwright/test';

const API_URL = 'http://localhost:3001';

const user = {
  name: 'Download Test User',
  email: `dl-${Date.now()}@test.com`,
  password: 'T3stP@ssw0rd!',
  acceptedTosVersion: '1.0.0',
  acceptedPrivacyVersion: '1.0.0',
};

let accessToken: string;
let sessionCookie: string;
let targetUserId: string;

test.describe.configure({ mode: 'serial' });

test.describe('Resume PDF Download', () => {
  test.beforeAll(async () => {
    // Create test user
    const signupRes = await fetch(`${API_URL}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const signupData = await signupRes.json();
    accessToken = signupData.data?.accessToken;

    // Login to get session cookie
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const setCookie = loginRes.headers.get('set-cookie') ?? '';
    const match = setCookie.match(/session=([^;]+)/);
    sessionCookie = match?.[1] ?? '';

    // Get enzoferracini's userId from public profile
    const profileRes = await fetch(`${API_URL}/api/v1/users/enzoferracini/profile`);
    const profileData = await profileRes.json();
    targetUserId = profileData.data?.user?.id;
  });

  test('public profile endpoint returns user data with id', async () => {
    expect(targetUserId).toBeTruthy();
    console.log('Target userId:', targetUserId);
  });

  test('download endpoint returns 401 without auth', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`);
    expect(res.status).toBe(401);
  });

  test('download endpoint returns PDF data with JWT auth', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.pdf).toBeTruthy();
    expect(body.data?.filename).toBe('resume.pdf');
  });

  test('generated PDF must be exactly 1 page', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    const pdfBase64 = body.data?.pdf as string;
    expect(pdfBase64).toBeTruthy();

    const pdfText = atob(pdfBase64);

    // Count page objects in PDF: /Type /Page (not /Pages)
    const pageMatches = pdfText.match(/\/Type\s*\/Page(?!s)/g);
    const pageCount = pageMatches?.length ?? 0;

    console.log(`PDF page count: ${pageCount}`);
    console.log(`PDF size: ${Math.round((pdfBase64.length * 0.75) / 1024)} KB`);

    expect(pageCount).toBe(1);
  });

  test('download endpoint returns PDF data with session cookie', async () => {
    const res = await fetch(`${API_URL}/api/v1/export/user/${targetUserId}/resume/pdf`, {
      headers: { Cookie: `session=${sessionCookie}` },
    });
    console.log('Cookie response status:', res.status);
    const body = await res.json();
    console.log('Cookie response:', JSON.stringify(body).slice(0, 200));

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.pdf).toBeTruthy();
  });

  test('browser download button works on profile page', async ({ browser }) => {
    // This test navigates to a profile page in the browser, which requires the
    // authenticated session to have completed onboarding (OnboardingGuard redirects
    // otherwise). Log in as the seeded `enzoferracini` user (hasCompletedOnboarding=true)
    // instead of the freshly-created dl-* user.
    const enzoLogin = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'enzo@patchcareers.local', password: 'Enzo_Test_123!' }),
    });
    const enzoCookie =
      (enzoLogin.headers.get('set-cookie') ?? '').match(/session=([^;]+)/)?.[1] ?? '';
    expect(enzoCookie).toBeTruthy();

    const ctx = await browser.newContext();
    await ctx.addCookies([
      {
        name: 'session',
        value: enzoCookie,
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

    // Check download button exists
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

    // Click download
    await downloadBtn.click();

    // Wait for download to process
    await page.waitForTimeout(5000);

    // Check for error message
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
