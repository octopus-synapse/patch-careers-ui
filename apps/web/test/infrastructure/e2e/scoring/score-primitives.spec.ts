import { expect, test } from '@playwright/test';
import { API_URL } from '../_helpers/auth';

/**
 * Smoke tests for the shared RankBadge / ScoreCard primitives via
 * consumer pages. We don't render them in isolation because
 * `packages/ui` has no Storybook wired into the Playwright baseURL;
 * instead we verify that pages that consume them render the expected
 * text patterns that only come out of the shared dictionary.
 */

test.describe('RankBadge + ScoreCard primitives', () => {
  // Removed: the previous `'admin resume-styles table renders rank letters S/A/B/C/D/F'`
  // test asserted RankBadge output on /platform/admin/resume-styles, but that page
  // renders Nome/Layout/Descrição/Origem columns only — no RankBadge. The smoke
  // for RankBadge lives elsewhere or should be authored against the actual
  // consumer page when one ships.

  test('scores hub renders either a numeric score or a teaser state', async ({ browser }) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!@#' }),
    });
    if (!res.ok) test.skip(true, 'admin seed unavailable');
    const match = (res.headers.get('set-cookie') ?? '').match(/access_token=([^;]+)/);
    const ctx = await browser.newContext();
    if (match) {
      await ctx.addCookies([
        {
          name: 'access_token',
          value: match[1],
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
    }
    const page = await ctx.newPage();
    await page.goto('/my-profile/scores');
    await page.waitForLoadState('networkidle');
    // Either a digit (numeric score) or a teaser CTA per card
    const numeric = page.locator('text=/\\/ 100/').first();
    const teaserCta = page.getByRole('link', {
      name: /Ver estilos|Buscar vagas|Responder question/i,
    });
    await expect(numeric.or(teaserCta.first())).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });
});
