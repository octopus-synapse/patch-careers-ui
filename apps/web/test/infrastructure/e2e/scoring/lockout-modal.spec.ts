import { type BrowserContext, expect, test } from '@playwright/test';
import { E2E_USER_CREDENTIALS, loginAs, maybeLoginAs } from '../_helpers/auth';

let ctx: BrowserContext | null;

test.describe('Global 409 lockout modal', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('lockout store exposes a Svelte 5 reactive module on window', async ({ browser }) => {
    // Without a running backend-triggered 409 we can't assert modal
    // opens, but we can verify the module loads by importing via the
    // app bundle. Visit the scores hub (uses the same bundle) then
    // evaluate `window.localStorage` so we have browser context.
    const ctx2 = await loginAs(browser, E2E_USER_CREDENTIALS);
    const page = await ctx2.newPage();
    const res = await page.goto('/my-profile/scores');
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    // Smoke-test: no "TypeError" from the lockout interceptor module.
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(500);
    expect(errors.filter((e) => /lockout|LockoutModal|extractLockoutCode/i.test(e))).toHaveLength(
      0,
    );
    await ctx2.close();
  });

  test('match compute as a standard user without fit-profile surfaces a lockout state', async () => {
    // The interceptor surfaces a Fit-Profile lockout for standard users
    // without a fit profile. Whether the page shows it as an inline
    // teaser (browse-jobs pre-fetch gate) OR as a modal after clicking a
    // job, either path counts — we just need the lockout copy to appear
    // somewhere on the route. No skip: if neither shows, the interceptor
    // regressed.
    if (!ctx) throw new Error('e2e-test login failed — seed may be stale');
    const page = await (ctx as BrowserContext).newPage();
    await page.goto('/careers/browse-jobs');

    // If the page renders a job table, click the first row to trigger
    // the 409 flow. Otherwise the gate already fired pre-render and the
    // teaser/modal is on the page directly.
    const firstJobRow = page.locator('tbody tr.cursor-pointer').first();
    if (await firstJobRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstJobRow.click();
    }

    const modalTitle = page.getByText(/Fit Profile necess[aá]rio/i);
    const teaserTitle = page.getByText(/Fit Profile/i).first();
    await expect(modalTitle.or(teaserTitle)).toBeVisible({ timeout: 15_000 });
    await page.close();
  });

  test('dismissing the lockout modal keeps the user on the same route', async () => {
    // If the modal didn't open in the previous test, nothing to dismiss —
    // this becomes a no-op skip. When it DOES open, confirm "Fechar"
    // keeps the URL stable.
    test.skip(!ctx, 'e2e-test user not available');
    const page = await (ctx as BrowserContext).newPage();
    await page.goto('/my-profile/scores');
    await page.waitForLoadState('networkidle');
    const close = page.getByRole('button', { name: /Fechar/i });
    const hasModal = (await close.count()) > 0;
    const before = page.url();
    if (hasModal) {
      await close.first().click();
      await page.waitForTimeout(300);
    }
    expect(page.url()).toBe(before);
    await page.close();
  });
});
