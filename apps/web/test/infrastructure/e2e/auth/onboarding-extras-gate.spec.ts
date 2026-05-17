import { type BrowserContext, expect, test } from '@playwright/test';
import { API_URL, loginAsUnonboardedUser } from '../_helpers/auth';
import { resetOnboardingToWelcome } from '../_helpers/onboarding-fixture';

let authContext: BrowserContext;

/** Jump straight to a step via the public goto endpoint. Mirrors what the
 *  sidebar would do, but skips all the form-filling in between. */
async function gotoStep(ctx: BrowserContext, stepId: string): Promise<void> {
  const cookies = await ctx.cookies();
  const accessToken = cookies.find((c) => c.name === 'access_token')?.value;
  if (!accessToken) throw new Error('gotoStep: missing access_token cookie');

  const res = await fetch(`${API_URL}/api/v1/onboarding/session/goto?locale=pt-BR`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: `access_token=${accessToken}`,
    },
    body: JSON.stringify({ stepId }),
  });
  if (!res.ok) {
    throw new Error(`gotoStep ${stepId} failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
}

test.describe('Onboarding — extras gate', () => {
  test.beforeAll(async ({ browser }) => {
    authContext = await loginAsUnonboardedUser(browser);
  });

  test.afterAll(async () => {
    await authContext?.close();
  });

  test.beforeEach(async () => {
    await resetOnboardingToWelcome(authContext);
  });

  test('lists every extra section as a toggleable card', async () => {
    await gotoStep(authContext, 'extras-gate');
    const page = await authContext.newPage();
    await page.goto('/onboarding');

    // The gate renders one button[aria-pressed] per extra. Names come from
    // the seed translations so this also catches a copy regression.
    const cards = page.locator('button[aria-pressed]');
    await expect(cards).toHaveCount(4, { timeout: 15_000 });

    // Bilingual matcher because the seed ships pt-BR + en labels.
    await expect(page.getByRole('button', { name: /projetos|projects/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /certifica|certifications/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /premia|awards/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publica|publications/i })).toBeVisible();

    await page.close();
  });

  test('persists selection via POST /v1/onboarding/session/extras and advances into the first opted-in extra', async () => {
    await gotoStep(authContext, 'extras-gate');
    const page = await authContext.newPage();
    await page.goto('/onboarding');

    const projects = page.getByRole('button', { name: /projetos|projects/i });
    const awards = page.getByRole('button', { name: /premia|awards/i });
    await expect(projects).toBeVisible({ timeout: 15_000 });
    await projects.click();
    await awards.click();
    await expect(projects).toHaveAttribute('aria-pressed', 'true');
    await expect(awards).toHaveAttribute('aria-pressed', 'true');

    // Continue should fire the extras mutation first, then `next`. Wait
    // for both responses so the assertion below sees the new currentStep.
    const continueBtn = page.getByRole('button', { name: /continuar|continue/i }).first();
    await Promise.all([
      page.waitForResponse(
        (r) => /\/onboarding\/session\/extras\b/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.waitForResponse(
        (r) => /\/onboarding\/session\/next\b/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      continueBtn.click(),
    ]);

    // Project is the canonical first extra (order=10 in the seed). The
    // stepper resets `currentStep` to it once activated.
    await expect(page.locator('h2')).toHaveText(/projetos|projects/i, { timeout: 10_000 });

    await page.close();
  });

  test('skipping the gate without selecting any extra goes straight to template', async () => {
    await gotoStep(authContext, 'extras-gate');
    const page = await authContext.newPage();
    await page.goto('/onboarding');

    const continueBtn = page.getByRole('button', { name: /continuar|continue/i }).first();
    await expect(continueBtn).toBeEnabled({ timeout: 10_000 });

    await Promise.all([
      page.waitForResponse(
        (r) => /\/onboarding\/session\/extras\b/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.waitForResponse(
        (r) => /\/onboarding\/session\/next\b/.test(r.url()) && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      continueBtn.click(),
    ]);

    // No extras activated → next core step after the gate is `template`.
    await expect(page.locator('h2')).toHaveText(/tema|theme/i, { timeout: 10_000 });

    await page.close();
  });
});
