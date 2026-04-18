import { expect, test } from '@playwright/test';

const API_URL = 'http://localhost:3001';

// Use a unique user per test run to avoid conflicts
const suffix = Date.now();
const testUser = {
  name: 'E2E Login User',
  email: `e2e-login-${suffix}@test.com`,
  password: 'T3stP@ssw0rd!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Login Flow', () => {
  test.beforeAll(async () => {
    const res = await fetch(`${API_URL}/api/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const body = await res.json();
    if (!body.success && !body.message?.includes('already')) {
      throw new Error(`Setup failed: ${JSON.stringify(body)}`);
    }
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login with valid credentials redirects', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 });
    expect(page.url()).not.toMatch(/\/login$/);
  });

  test('login with wrong password stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill('WrongPassword123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/login');
  });

  test('login with nonexistent email stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('nobody@nowhere.com');
    await page.locator('input[type="password"]').fill('SomePassword123!');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/login');
  });

  test('empty form does not submit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });
});
