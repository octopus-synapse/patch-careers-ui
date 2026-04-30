import { expect, test } from '@playwright/test';

test.describe('Search → people', () => {
  test('shows enzoferracini when searching for "enzo"', async ({ page }) => {
    // Search page lives under /careers/search with ?type=people as the
    // People tab. `/search` is not a real route.
    await page.goto('/careers/search?q=enzo&type=people');

    // The page should resolve the query string and render the People tab
    // with at least one card pointing at the existing seeded user.
    const enzoLink = page.getByRole('link', { name: /enzoferracini/i });

    await expect(enzoLink).toBeVisible({ timeout: 10_000 });
  });
});
