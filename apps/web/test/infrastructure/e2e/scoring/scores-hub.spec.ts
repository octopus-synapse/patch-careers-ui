import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAs } from '../_helpers/auth';

let ctx: BrowserContext;

test.describe('Scores hub /my-profile/scores', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await loginAs(browser, ADMIN_CREDENTIALS);
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('loads without JS errors', async () => {
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const response = await page.goto('/my-profile/scores');
    expect(response?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('renders the three scoring cards', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/scores');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Resume Quality').first()).toBeVisible();
    await expect(page.getByText('Match Score').first()).toBeVisible();
    await expect(page.getByText('Style Score').first()).toBeVisible();
    await page.close();
  });

  test('shows the explanation block linking to fit-profile status', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/scores');
    await page.waitForLoadState('networkidle');
    const link = page.getByRole('link', { name: /Fit Profile/i });
    await expect(link.first()).toBeVisible();
    await page.close();
  });

  test('redirects to sign-in when unauthenticated', async ({ browser }) => {
    const anon = await browser.newContext();
    const page = await anon.newPage();
    await page.goto('/my-profile/scores');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/identity\/sign-in|\/$/);
    await anon.close();
  });

  test('hub page heading matches product copy', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/scores');
    await expect(page.locator('h1', { hasText: /scores/i })).toBeVisible();
    await page.close();
  });
});
