import { expect, test } from '@playwright/test';

test.describe('Protected routes', () => {
  test('dashboard should redirect to /login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL('/login');
    expect(page.url()).toContain('/login');
  });
});
