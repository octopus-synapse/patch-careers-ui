import { type BrowserContext, expect, test } from '@playwright/test';

const API_URL = 'http://localhost:3001';

// `/test-404` used to exist as a top-level public dev route; it now lives under
// the admin dev-tools segment, so these tests need an authenticated admin
// session to reach it. Credentials come from the backend seed — see
// `profile-services/prisma/seed.ts` (ADMIN_EMAIL/ADMIN_PASSWORD defaults).
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const ADMIN_TEST_PATH = '/platform/admin/dev-tools/test-404';

let adminContext: BrowserContext;

async function loginAdminContext(browser: import('@playwright/test').Browser) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${await res.text()}`);
  const match = (res.headers.get('set-cookie') ?? '').match(/session=([^;]+)/);
  if (!match) throw new Error('No session cookie from admin login');
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

test.describe('Double refresh bug', () => {
  test.beforeAll(async ({ browser }) => {
    adminContext = await loginAdminContext(browser);
  });

  test.afterAll(async () => {
    await adminContext?.close();
  });

  const pages = [
    { path: '/', requiresAdmin: false },
    { path: ADMIN_TEST_PATH, requiresAdmin: true },
  ];

  for (const { path, requiresAdmin } of pages) {
    test(`page ${path} survives two consecutive F5 refreshes`, async ({ browser }) => {
      const page = requiresAdmin ? await adminContext.newPage() : await browser.newPage();

      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('requestfailed', (req) => {
        failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
      });

      // Step 1: Initial navigation
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const bodyBefore = await page.locator('body').innerHTML();
      expect(bodyBefore.length).toBeGreaterThan(0);
      await page.screenshot({
        path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step1-initial.png`,
      });

      // Step 2: First F5 refresh
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const bodyAfterFirst = await page.locator('body').innerHTML();
      expect(bodyAfterFirst.length).toBeGreaterThan(0);
      await page.screenshot({
        path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step2-first-refresh.png`,
      });

      // Step 3: Second F5 refresh (this is where the bug occurred)
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const bodyAfterSecond = await page.locator('body').innerHTML();
      expect(bodyAfterSecond.length).toBeGreaterThan(0);
      await page.screenshot({
        path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step3-second-refresh.png`,
      });

      // Step 4: Third refresh for good measure
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const bodyAfterThird = await page.locator('body').innerHTML();
      expect(bodyAfterThird.length).toBeGreaterThan(0);
      await page.screenshot({
        path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step4-third-refresh.png`,
      });

      // Verify no critical console errors
      const criticalErrors = consoleErrors.filter(
        (e) =>
          e.includes('Failed to fetch') || e.includes('ChunkLoadError') || e.includes('TypeError'),
      );
      expect(criticalErrors).toEqual([]);

      // Verify no failed network requests
      expect(failedRequests).toEqual([]);

      await page.close();
    });
  }

  test('Cache-Control header is set to no-store for HTML pages', async ({ request }) => {
    const response = await request.get('/');
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toBe('no-store');
  });

  test('page does not go blank after rapid consecutive refreshes', async () => {
    const page = await adminContext.newPage();

    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(ADMIN_TEST_PATH, { waitUntil: 'networkidle' });

    // Rapid-fire 5 reloads
    for (let i = 0; i < 5; i++) {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(200);
    }

    // After all reloads, page should still render
    await page.waitForTimeout(1000);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });

    const text = await heading.textContent();
    expect(text).toBe('Test Page');

    await page.close();
  });
});
