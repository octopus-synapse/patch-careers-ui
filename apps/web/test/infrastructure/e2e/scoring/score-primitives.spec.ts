import { expect, test } from '@playwright/test';

/**
 * Smoke tests for the shared RankBadge / ScoreCard primitives via
 * consumer pages. We don't render them in isolation because
 * `packages/ui` has no Storybook wired into the Playwright baseURL;
 * instead we verify that pages that consume them render the expected
 * text patterns that only come out of the shared dictionary.
 */

test.describe('RankBadge + ScoreCard primitives', () => {
  test('admin resume-styles table renders rank letters S/A/B/C/D/F', async ({ browser }) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!@#' }),
    });
    if (!res.ok) test.skip(true, 'admin seed unavailable');
    const match = (res.headers.get('set-cookie') ?? '').match(/session=([^;]+)/);
    const ctx = await browser.newContext();
    if (match) {
      await ctx.addCookies([
        {
          name: 'session',
          value: match[1],
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
    }
    const page = await ctx.newPage();
    await page.goto('/platform/admin/resume-styles');
    await page.waitForLoadState('networkidle');
    // The seeded styles score 88 and 92, which render as A and S. At
    // least one of these rank letters must be visible inside a badge.
    const hasAnyRank = await page
      .locator('span', {
        hasText: /^(S|A|B|C|D|F)$/,
      })
      .count();
    expect(hasAnyRank).toBeGreaterThan(0);
    await ctx.close();
  });

  test('scores hub renders either a numeric score or a teaser state', async ({ browser }) => {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123!@#' }),
    });
    if (!res.ok) test.skip(true, 'admin seed unavailable');
    const match = (res.headers.get('set-cookie') ?? '').match(/session=([^;]+)/);
    const ctx = await browser.newContext();
    if (match) {
      await ctx.addCookies([
        {
          name: 'session',
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
