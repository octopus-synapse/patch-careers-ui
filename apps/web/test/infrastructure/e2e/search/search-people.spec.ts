import { expect, test } from '@playwright/test';

test.describe('Search → people', () => {
  test('shows enzoferracini when searching for "enzo"', async ({ page }) => {
    // Mirrors the URL the user opened in their session
    // (http://localhost:3000/search?q=enzo&type=people) but uses the
    // Playwright-managed dev server so the latest code is exercised.
    await page.goto('/search?q=enzo&type=people');

    // The page should resolve the query string and render the People tab
    // with at least one card pointing at the existing seeded user.
    const enzoLink = page.getByRole('link', { name: /enzoferracini/i });

    await expect(enzoLink).toBeVisible({ timeout: 10_000 });
  });
});
