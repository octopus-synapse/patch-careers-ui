import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAs } from '../_helpers/auth';

let ctx: BrowserContext;

test.describe('Admin fit-questions CRUD', () => {
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
    const res = await page.goto('/platform/admin/fit-questions');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('heading + stratification counters render', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/fit-questions');
    await expect(page.locator('h1', { hasText: /Fit Questions/i })).toBeVisible();
    await expect(page.getByText('Big Five').first()).toBeVisible();
    await expect(page.getByText('Schwartz').first()).toBeVisible();
    await expect(page.getByText('SDT').first()).toBeVisible();
    await page.close();
  });

  test('the stratification shows the seeded totals (30 BF / 50 SW / 20 SDT)', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/fit-questions');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('30', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('50', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('20', { exact: true }).first()).toBeVisible();
    await page.close();
  });

  test('create modal opens with dimension select populated', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/fit-questions');
    await page.getByRole('button', { name: /Nova quest[aã]o/i }).click();
    await expect(page.getByLabel('Key')).toBeVisible();
    await expect(page.getByLabel('Dimensão')).toBeVisible();
    await expect(page.getByLabel(/Texto \(EN\)/)).toBeVisible();
    await expect(page.getByLabel(/Texto \(pt-BR\)/)).toBeVisible();
    await page.close();
  });

  test('dimension select contains all 18 values', async () => {
    const page = await ctx.newPage();
    await page.goto('/platform/admin/fit-questions');
    await page.getByRole('button', { name: /Nova quest[aã]o/i }).click();
    const options = page.locator('select#q-dim option');
    expect(await options.count()).toBe(18);
    await page.close();
  });
});
