import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAs } from '../_helpers/auth';

let ctx: BrowserContext;

test.describe('User style picker /my-profile/styles', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await loginAs(browser, ADMIN_CREDENTIALS);
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('page loads without JS errors', async () => {
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('/my-profile/styles');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('renders the heading + description', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/styles');
    await expect(page.locator('h1', { hasText: /Estilos/i })).toBeVisible();
    await expect(page.getByText(/ATS-safe/i).first()).toBeVisible();
    await page.close();
  });

  test('shows at least the two seeded system styles (ATS Classic + ATS Compact)', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/styles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('ATS Classic').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('ATS Compact').first()).toBeVisible();
    await page.close();
  });

  test('each system style card shows the "Sistema" lock pill', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/styles');
    await page.waitForLoadState('networkidle');
    const pills = page.getByText('Sistema', { exact: true });
    expect(await pills.count()).toBeGreaterThanOrEqual(2);
    await page.close();
  });

  test('"Aplicar" buttons render for each style', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/styles');
    await page.waitForLoadState('networkidle');
    const applyBtns = page.getByRole('button', { name: /Aplicar/i });
    expect(await applyBtns.count()).toBeGreaterThanOrEqual(2);
    await page.close();
  });
});
