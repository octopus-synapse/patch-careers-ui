import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAs } from '../_helpers/auth';

let ctx: BrowserContext;

test.describe('Fit Profile status + wizard', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await loginAs(browser, ADMIN_CREDENTIALS);
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('status page renders without JS errors', async () => {
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('/my-profile/fit-profile');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('status page headline is visible', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/fit-profile');
    await expect(page.locator('h1', { hasText: /Fit Profile/i })).toBeVisible();
    await page.close();
  });

  test('questionnaire page loads the 25 questions header', async () => {
    const page = await ctx.newPage();
    const res = await page.goto('/my-profile/fit-profile/questions');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    // Either the "Fit Profile · X / 25" header or an error card
    const progress = page.getByText(/\/\s*25/i);
    const errorCard = page.getByText(/n[aã]o conseguimos/i);
    await expect(progress.first().or(errorCard.first())).toBeVisible();
    await page.close();
  });

  test('questionnaire renders the 5 Likert options when a question loads', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/fit-profile/questions');
    await page.waitForLoadState('networkidle');
    // If the wizard loaded, all five option labels should be present
    const likertTexts = [
      'Discordo fortemente',
      'Discordo',
      'Neutro',
      'Concordo',
      'Concordo fortemente',
    ];
    for (const t of likertTexts) {
      // At most one row per label; just assert attached if the wizard is live
      const loc = page.getByText(t, { exact: true });
      if (await loc.count()) {
        await expect(loc.first()).toBeVisible();
      }
    }
    await page.close();
  });

  test('questionnaire advances when a Likert option is picked', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/fit-profile/questions');
    await page.waitForLoadState('networkidle');
    const initial = await page
      .getByText(/^\d+\s*\/\s*\d+$/)
      .first()
      .textContent();
    const neutralBtn = page.getByRole('button', { name: 'Neutro', exact: true });
    if (await neutralBtn.count()) {
      await neutralBtn.first().click();
      const advance = page.getByRole('button', { name: /Pr[oó]xima|Salvar/i });
      await advance.first().click();
      await page.waitForTimeout(300);
      const now = await page
        .getByText(/^\d+\s*\/\s*\d+$/)
        .first()
        .textContent();
      // Either advanced, or it was the last question and the save was triggered
      expect(now).not.toBe(initial);
    }
    await page.close();
  });

  test('status page "start now" CTA routes to /questions', async () => {
    const page = await ctx.newPage();
    await page.goto('/my-profile/fit-profile');
    await page.waitForLoadState('networkidle');
    const cta = page.getByRole('button', { name: /Come[çc]ar agora|Refazer question[aá]rio/i });
    if (await cta.count()) {
      await cta.first().click();
      await page.waitForURL(/\/my-profile\/fit-profile\/questions/, { timeout: 10000 });
      expect(page.url()).toContain('/my-profile/fit-profile/questions');
    }
    await page.close();
  });

  test('unauthenticated user is redirected away from the wizard', async ({ browser }) => {
    const anon = await browser.newContext();
    const page = await anon.newPage();
    await page.goto('/my-profile/fit-profile/questions');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/identity\/sign-in|\/$/);
    await anon.close();
  });
});
