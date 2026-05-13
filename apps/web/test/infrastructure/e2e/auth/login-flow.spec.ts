import { expect, test } from '@playwright/test';
import { API_URL } from '../_helpers/auth';

// Use a unique user per test run to avoid conflicts
const suffix = Date.now();
const testUser = {
  name: 'E2E Login User',
  email: `e2e-login-${suffix}@test.com`,
  password: 'T3stP@ssw0rd!',
  acceptedTosVersion: '1.0.0',
  acceptedPrivacyVersion: '1.0.0',
};

test.describe.configure({ mode: 'serial' });

test.describe('Login Flow', () => {
  test.beforeAll(async () => {
    const res = await fetch(`${API_URL}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    // Backend returns the bare user payload on success (no `success: true`
    // envelope) or a domain error with `statusCode >= 400` on failure.
    // 409 / duplicate email is fine — the user might already exist from a
    // previous run inside the same DB.
    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as Record<string, unknown>);
      const message = String((body as { message?: unknown }).message ?? '');
      if (!/already|exists|duplicate/i.test(message)) {
        throw new Error(`Setup failed: ${res.status} ${JSON.stringify(body)}`);
      }
    }
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/identity/sign-in');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login with valid credentials redirects', async ({ page }) => {
    await page.goto('/identity/sign-in');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.endsWith('/identity/sign-in'), { timeout: 15000 });
    expect(page.url()).not.toMatch(/\/identity\/sign-in$/);
  });

  test('login with wrong password stays on login', async ({ page }) => {
    await page.goto('/identity/sign-in');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/identity/sign-in');
  });

  test('login with nonexistent email stays on login', async ({ page }) => {
    await page.goto('/identity/sign-in');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('nobody@nowhere.com');
    await page.locator('input[type="password"]').fill('SomePassword123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/identity/sign-in');
  });

  test('empty form does not submit', async ({ page }) => {
    await page.goto('/identity/sign-in');
    await page.waitForLoadState('networkidle');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/identity/sign-in');
  });
});
