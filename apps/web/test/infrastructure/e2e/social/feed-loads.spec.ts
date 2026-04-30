import { expect, test } from '@playwright/test';
import { E2E_USER_CREDENTIALS, maybeLoginAs } from '../_helpers/auth';

/**
 * Regression: /social/feed was showing "Não foi possível carregar o feed"
 * for every user with the default `role_user` role because the backend's
 * `FeedController` required `Permission.FEED_USE`, which only belongs to
 * `grp_feed_user`, and `role_user` did NOT include that group.
 *
 * The UI surfaces that 403 as the generic error banner; the user had no
 * way to dismiss it short of being escalated to admin.
 *
 * This spec logs in as the seeded e2e fixture user (standard role) and
 * asserts the feed renders without the error card. Passing this test
 * proves `role_user` → `FEED_USE` is wired end-to-end.
 */

test.describe('Social feed — standard user', () => {
  test('loads /social/feed without the error banner for a default-role user', async ({
    browser,
  }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing — skip rather than fail');

    const page = await (ctx as NonNullable<typeof ctx>).newPage();
    const feedErrors: string[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/v1/feed') && r.status() === 403) {
        feedErrors.push(`HTTP 403 ${r.url()}`);
      }
    });
    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    const errorBanner = page.getByText(/Não foi possível carregar o feed/i);
    await expect(errorBanner).toHaveCount(0);
    expect(feedErrors, 'feed endpoint must not 403 for a standard user').toHaveLength(0);

    await ctx?.close();
  });
});
