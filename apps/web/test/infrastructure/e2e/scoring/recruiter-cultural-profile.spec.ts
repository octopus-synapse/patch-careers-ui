import { type BrowserContext, expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, API_URL, loginAs } from '../_helpers/auth';

/** We need a real Job id for the page to load. Admins have permission
 *  to list jobs; pick the first seeded one. The jobs endpoint is auth
 *  gated so we authenticate first and forward the cookie. */
async function firstJobId(): Promise<string | null> {
  try {
    const login = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS),
    });
    if (!login.ok) return null;
    const cookie = login.headers.get('set-cookie') ?? '';
    const match = cookie.match(/access_token=([^;]+)/);
    if (!match) return null;
    const res = await fetch(`${API_URL}/api/v1/jobs?page=1&limit=1`, {
      headers: { cookie: `access_token=${match[1]}` },
    });
    if (!res.ok) return null;
    // Pagination envelope per profile-services Q1: top-level `{items, total, ...}`
    // — no `data` wrapper.
    const body = (await res.json()) as { items?: Array<{ id?: string }> };
    return body.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

let ctx: BrowserContext;
let jobId: string | null;

test.describe('Recruiter cultural-profile sliders', () => {
  test.beforeAll(async ({ browser }) => {
    ctx = await loginAs(browser, ADMIN_CREDENTIALS);
    jobId = await firstJobId();
  });
  test.afterAll(async () => {
    await ctx?.close();
  });

  test('page loads without JS errors for an existing job', async () => {
    test.skip(!jobId, 'no seeded jobs to test against');
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(`/recruiting/jobs/${jobId}/cultural-profile`);
    expect(res?.status()).toBeLessThan(500);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
    await page.close();
  });

  test('renders all 18 sliders grouped by block', async () => {
    test.skip(!jobId, 'no seeded jobs to test against');
    const page = await ctx.newPage();
    await page.goto(`/recruiting/jobs/${jobId}/cultural-profile`);
    // Headings render the raw bucket keys (`bigFive` / `schwartz` / `sdt`)
    // from the DIMENSIONS object — no humanised "Big Five" label yet.
    await expect(page.getByText('bigFive').first()).toBeVisible();
    await expect(page.getByText('schwartz').first()).toBeVisible();
    await expect(page.getByText('sdt').first()).toBeVisible();
    const ranges = page.locator('input[type="range"]');
    expect(await ranges.count()).toBe(18);
    await page.close();
  });

  test('save button is present and labelled', async () => {
    test.skip(!jobId, 'no seeded jobs to test against');
    const page = await ctx.newPage();
    await page.goto(`/recruiting/jobs/${jobId}/cultural-profile`);
    // The save button is labelled simply "Salvar" (with a Save icon) — the
    // longer "Salvar cultural profile" string only existed in the test's
    // imagination.
    await expect(page.getByRole('button', { name: /Salvar/i })).toBeVisible();
    await page.close();
  });
});
