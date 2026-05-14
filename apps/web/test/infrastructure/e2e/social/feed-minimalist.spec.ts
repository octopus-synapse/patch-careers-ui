import { expect, test } from '@playwright/test';
import { E2E_USER_CREDENTIALS, maybeLoginAs } from '../_helpers/auth';

/**
 * Minimalist feed surface (post-refactor):
 *   - Sidebar has exactly 3 items: Explorar, Minha Bolha, Salvos.
 *   - No "Próximos eventos" card, no "Em breve" placeholders, no
 *     trending panel on the right.
 *   - Top-of-feed Tabs are gone (mode is route-driven instead).
 *   - /social/feed/bubble renders the followingOnly variant.
 *   - Engagement bar is a single heart (no 5-reaction picker).
 *
 * Failing assertions here = regression to the maximalist surface.
 */

test.describe('Social feed — minimalist surface', () => {
  test('left rail shows only Explorar / Minha Bolha / Salvos', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing — skip rather than fail');
    const page = await (ctx as NonNullable<typeof ctx>).newPage();

    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    const navItems = page.locator('aside nav a');
    await expect(navItems).toHaveCount(3);

    await expect(page.getByText(/Próximos eventos|Upcoming events/i)).toHaveCount(0);
    await expect(page.getByText(/Em breve|Coming soon/i)).toHaveCount(0);
    await expect(page.getByText(/Em alta|Trending/i)).toHaveCount(0);

    await ctx?.close();
  });

  test('top-of-feed Tabs (Explorar/Minha bolha) are gone', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing — skip rather than fail');
    const page = await (ctx as NonNullable<typeof ctx>).newPage();

    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    // Old maximalist surface used role=tab on the segmented control.
    const oldTabs = page.locator('[role="tab"]');
    await expect(oldTabs).toHaveCount(0);

    await ctx?.close();
  });

  test('/social/feed/bubble route renders without 404', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing — skip rather than fail');
    const page = await (ctx as NonNullable<typeof ctx>).newPage();

    await page.goto('/social/feed/bubble');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/social/feed/bubble');
    await expect(page.locator('aside nav a')).toHaveCount(3);

    await ctx?.close();
  });

  test('reaction picker is replaced by a single heart-only Like', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing — skip rather than fail');
    const page = await (ctx as NonNullable<typeof ctx>).newPage();

    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    // Old ReactionPicker exposed a `triggerAriaLabel` "Reagir a este post"
    // / "React to this post". Either copy means the maximalist UI leaked.
    await expect(page.getByLabel(/Reagir a este post|React to this post/i)).toHaveCount(0);

    await ctx?.close();
  });
});
