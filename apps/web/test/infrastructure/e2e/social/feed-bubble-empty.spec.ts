import { expect, test } from '@playwright/test';
import { E2E_USER_CREDENTIALS, maybeLoginAs } from '../_helpers/auth';

/**
 * Regression: switching to the "Minha bolha" tab for a user who follows
 * nobody returns an empty timeline. The `useFeedPagination` effect was
 * reassigning `allPosts = postsArr` on every tick (two fresh empty-array
 * refs), reading `allPosts.length` in the same pass — classic
 * effect_update_depth_exceeded. The runaway reactive cycle pegged the
 * event loop and every other button on the page stopped responding
 * (what the user saw as "tela congelada").
 *
 * This spec pins the fix by clicking bolha and then asserting both:
 *  - no `effect_update_depth_exceeded` pageerror
 *  - a subsequent click (composer "Criar post" button) still opens its
 *    modal — i.e., the page is still interactive.
 */

test.describe('Feed — Minha bolha with empty timeline', () => {
  test('empty bubble does not freeze the page', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing');

    const page = await (ctx as NonNullable<typeof ctx>).newPage();
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => window.scrollBy(0, 600));
    const stickyBar = page.getByTestId('feed-reveal-tabs');
    await expect(stickyBar).toBeVisible();
    await stickyBar.getByRole('tab', { name: 'Minha bolha', exact: true }).click();
    await page.waitForLoadState('networkidle');

    // Reactivity must not have exploded.
    const depthErr = pageErrors.find((m) => m.includes('effect_update_depth_exceeded'));
    expect(depthErr, `reactive self-loop regressed: ${pageErrors.join(' | ')}`).toBeUndefined();

    // Page is still interactive: clicking the composer opens the modal.
    await page.evaluate(() => window.scrollTo(0, 0));
    const createBtn = page.getByRole('button', { name: /criar post/i }).first();
    await expect(createBtn).toBeVisible();
    await createBtn.click({ timeout: 3000 });
    await expect(page.getByRole('dialog', { name: /create post/i })).toBeVisible({
      timeout: 3000,
    });

    await ctx?.close();
  });
});
