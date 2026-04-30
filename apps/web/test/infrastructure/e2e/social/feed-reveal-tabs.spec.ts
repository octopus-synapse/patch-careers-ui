import { expect, test } from '@playwright/test';
import { E2E_USER_CREDENTIALS, maybeLoginAs } from '../_helpers/auth';

/**
 * Design: the old mode tabs + type-filter pills are gone. In their place, a
 * two-tab reveal-on-scroll bar ("Explorar" default + "Minha bolha") slides
 * in once the composer scrolls out of view. Default tab is Explorar →
 * timeline without `followingOnly`. Bubble sends `followingOnly=true`.
 *
 * This spec locks that contract: no pills anywhere, no sticky tabs on
 * first paint, tabs appear after scroll, and toggling to bolha changes
 * the outgoing request.
 */

test.describe('Feed — reveal-on-scroll tabs', () => {
  test('tabs hidden on load, appear on scroll, bolha sends followingOnly=true', async ({
    browser,
  }) => {
    const ctx = await maybeLoginAs(browser, E2E_USER_CREDENTIALS);
    test.skip(!ctx, 'seed e2e user missing');

    const page = await (ctx as NonNullable<typeof ctx>).newPage();
    const feedUrls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/v1/feed') && req.method() === 'GET') {
        feedUrls.push(req.url());
      }
    });
    await page.goto('/social/feed');
    await page.waitForLoadState('networkidle');

    // None of the old filter pills should render.
    for (const pill of [
      'Conquista',
      'Oportunidade',
      'Aprendizado',
      'Projeto',
      'Pergunta',
      'Desafio',
    ]) {
      const locator = page.getByRole('button', { name: pill, exact: true });
      await expect(locator, `filter pill "${pill}" should not render`).toHaveCount(0);
    }
    // "Atividade" tab is gone for good.
    await expect(page.getByRole('tab', { name: 'Atividade', exact: true })).toHaveCount(0);

    // On load — composer visible, sticky tabs bar NOT shown.
    const stickyBar = page.getByTestId('feed-reveal-tabs');
    await expect(stickyBar).toHaveCount(0);

    // First feed call uses defaults.
    expect(feedUrls.length, 'feed query should fire').toBeGreaterThan(0);
    const first = feedUrls[0] ?? '';
    expect(
      first.includes('followingOnly=true'),
      `initial call must not be followingOnly; got: ${first}`,
    ).toBe(false);
    expect(first.includes('type='), `type filter must not be present; got: ${first}`).toBe(false);

    // Scroll so the composer leaves the viewport; sticky bar should mount.
    await page.evaluate(() => window.scrollBy(0, 600));
    await expect(stickyBar).toBeVisible();

    const exploreTab = stickyBar.getByRole('tab', { name: 'Explorar', exact: true });
    const bubbleTab = stickyBar.getByRole('tab', { name: 'Minha bolha', exact: true });
    await expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    await expect(bubbleTab).toHaveAttribute('aria-selected', 'false');

    // Click "Minha bolha" → new request with followingOnly=true.
    const before = feedUrls.length;
    await bubbleTab.click();
    await expect(bubbleTab).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');

    const afterBubble = feedUrls.slice(before);
    expect(afterBubble.length, 'bolha toggle should re-fetch').toBeGreaterThan(0);
    expect(
      afterBubble.some((u) => u.includes('followingOnly=true')),
      `bolha call must include followingOnly=true; got: ${afterBubble.join(' | ')}`,
    ).toBe(true);

    await ctx?.close();
  });
});
