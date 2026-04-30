import { expect, test } from '@playwright/test';

test.describe('Protected routes', () => {
  test('my-profile/dashboard should redirect to /identity/sign-in when not authenticated', async ({
    page,
  }) => {
    await page.goto('/my-profile/dashboard');

    await page.waitForURL('**/identity/sign-in', { timeout: 10000 });
    expect(page.url()).toContain('/identity/sign-in');
  });
});
