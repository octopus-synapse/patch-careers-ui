import { expect, test } from '@playwright/test';
import { loginAs, STANDARD_USER_CREDENTIALS } from '../_helpers/auth';

test.describe('Search → people', () => {
  test('shows enzoferracini when searching for "enzo"', async ({ browser }) => {
    // Search page lives under /careers/search with ?type=people as the
    // People tab. `/search` is not a real route. The page is gated by
    // `<FeatureRouteGuard flag="jobs">` in careers/+layout, so authenticate
    // first — anonymous visitors fail the guard before the search results
    // render.
    const ctx = await loginAs(browser, STANDARD_USER_CREDENTIALS);
    const page = await ctx.newPage();
    await page.goto('/careers/search?q=enzo&type=people');

    const enzoLink = page.getByRole('link', { name: /enzoferracini/i });

    await expect(enzoLink).toBeVisible({ timeout: 10_000 });
    await ctx.close();
  });
});
