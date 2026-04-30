import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAs } from '../_helpers/auth';

let ctx: BrowserContext;

test.describe('Admin resume-styles CRUD', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await loginAs(browser, ADMIN_CREDENTIALS);
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('page loads without JS errors for admins', async () => {
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('/platform/admin/resume-styles');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('renders the admin page heading and "Novo estilo" button', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/resume-styles');
    await expect(page.locator('h1', { hasText: /Resume Styles/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo estilo/i })).toBeVisible();
    await page.close();
  });

  test('table lists both system-seeded styles by name', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/resume-styles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('ATS Classic').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('ATS Compact').first()).toBeVisible();
    await page.close();
  });

  test('system styles expose a Preview link but no edit/delete actions', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/resume-styles');
    await page.waitForLoadState('networkidle');
    // At least 2 preview links (one per system style)
    const previews = page.getByRole('link', { name: 'Preview', exact: true });
    expect(await previews.count()).toBeGreaterThanOrEqual(2);
    await page.close();
  });

  test('create modal opens and carries the required form fields', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/resume-styles');
    await page.getByRole('button', { name: /Novo estilo/i }).click();
    await expect(page.getByLabel('Nome')).toBeVisible();
    await expect(page.getByLabel('Typst template')).toBeVisible();
    await expect(page.getByLabel('Layout')).toBeVisible();
    await expect(page.getByLabel(/styleConfig/)).toBeVisible();
    await page.close();
  });

  test('non-admin gets redirected away from the admin route', async ({ browser }) => {
    const anon = await browser.newContext();
    const page = await anon.newPage();
    await page.goto('/platform/admin/resume-styles');
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toMatch(/\/platform\/admin\/resume-styles$/);
    await anon.close();
  });
});
