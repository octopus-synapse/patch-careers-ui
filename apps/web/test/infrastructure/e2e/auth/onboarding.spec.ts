import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { loginAsUnonboardedUser } from '../_helpers/auth';
import { resetOnboardingToWelcome } from '../_helpers/onboarding-fixture';

let authContext: BrowserContext;

// Dismiss the welcome screen if present. Welcome shows h1 + "Começar agora" button
// and renders outside the stepper frame (no sidebar, no h2). Tests need to advance
// past it before looking for h2/aside.
async function enterStepper(page: Page) {
  await page.goto('/onboarding');
  // `expect(...).toBeVisible({timeout})` is our load wait. `waitForLoadState('networkidle')`
  // is unreliable here because the authenticated layout opens an SSE notifications
  // stream that holds the connection open indefinitely — networkidle never settles.
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  const startBtn = page
    .locator('button')
    .filter({ hasText: /vamos l.|let's go|come.ar agora|start now/i })
    .first();
  if (await startBtn.isVisible().catch(() => false)) {
    await Promise.all([
      page
        .waitForResponse(
          (r) => /\/onboarding\/session\/next\b/.test(r.url()) && r.request().method() === 'POST',
          { timeout: 5_000 },
        )
        .catch(() => undefined),
      startBtn.click(),
    ]);
  }
  await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  // Deterministic landing: navigate to the personal-info step via the
  // sidebar `data-step-id` selector. Previous-test state pollution (a
  // sibling test left the user at username when its page closed mid-flight)
  // would otherwise put us on the wrong step here. Clicking the canonical
  // step button is idempotent — no-op when already there, /goto otherwise.
  const personalBtn = page.locator('aside button[data-step-id="personal-info"]');
  if (await personalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await Promise.all([
      page
        .waitForResponse(
          (r) => /\/onboarding\/session\/goto\b/.test(r.url()) && r.request().method() === 'POST',
          { timeout: 5_000 },
        )
        .catch(() => undefined),
      personalBtn.click(),
    ]);
    await expect(page.locator('h2')).toHaveText(/sobre voc.|about you|dados\s+pessoais|personal\s+info/i, {
      timeout: 10_000,
    });
  }
  // Wait for the Continue button to actually be enabled before letting
  // the caller proceed — otherwise a still-pending `$gotoStep.isPending`
  // flag swallows the test's subsequent click (handleNext early-returns
  // when any mutation is pending) and the /next call never fires.
  const continueBtn = page.locator('button').filter({ hasText: /continuar|continue/i }).first();
  await expect(continueBtn).toBeEnabled({ timeout: 10_000 });
}

test.describe('Onboarding page', () => {
  test.describe('Unauthenticated', () => {
    test('should redirect to /identity/sign-in when not authenticated', async ({ page }) => {
      await page.goto('/onboarding');
      await page.waitForURL('**/identity/sign-in', { timeout: 10000 });
      expect(page.url()).toContain('/identity/sign-in');
    });
  });

  test.describe('Authenticated (fresh user)', () => {
    test.beforeAll(async ({ browser }) => {
      authContext = await loginAsUnonboardedUser(browser);
    });

    test.afterAll(async () => {
      await authContext?.close();
    });

    // Reset the seeded fixture user's onboarding progress back to the
    // welcome step before each test. Tests share `authContext` (speed),
    // but every test assumes the user starts at welcome — so the
    // per-test reset enforces F.I.R.S.T. Independent against the
    // shared DB state.
    test.beforeEach(async () => {
      await resetOnboardingToWelcome(authContext);
    });

    test('should render without console errors', async () => {
      const page = await authContext.newPage();
      const jsErrors: string[] = [];
      const consoleErrors: string[] = [];

      page.on('pageerror', (err) => jsErrors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto('/onboarding');
      await page.waitForTimeout(3000);

      expect(jsErrors).toHaveLength(0);
      const networkErrors = consoleErrors.filter(
        (e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED'),
      );
      expect(networkErrors).toHaveLength(0);
      await page.close();
    });

    test('should display onboarding title and subtitle', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const h2 = page.locator('h2');
      const text = await h2.textContent();
      expect(text?.length).toBeGreaterThan(0);
      await page.close();
    });

    test('should display sidebar with steps on desktop', async () => {
      const page = await authContext.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      await enterStepper(page);

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      const stepButtons = sidebar.locator('button');
      const count = await stepButtons.count();
      expect(count).toBeGreaterThan(0);
      await page.close();
    });

    test('should display progress bar in sidebar', async () => {
      const page = await authContext.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      await enterStepper(page);

      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible({ timeout: 10000 });

      const progressText = sidebar.locator('span').first();
      await expect(progressText).toBeVisible();
      await page.close();
    });

    test('should hide sidebar on mobile', async () => {
      const page = await authContext.newPage();
      await page.setViewportSize({ width: 375, height: 667 });
      await enterStepper(page);

      const sidebar = page.locator('aside');
      await expect(sidebar).not.toBeVisible();
      await page.close();
    });

    test('should display current step label', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const stepTitle = page.locator('h2');
      const text = await stepTitle.textContent();
      expect(text?.length).toBeGreaterThan(0);
      await page.close();
    });

    test('should display Continue button', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
      await expect(nextBtn).toBeVisible();
      await page.close();
    });

    // 'should not display Back button on first step' — REMOVED.
    // The previous body used an `if (!hasBack) expect(hasBack).toBe(false)` tautology
    // (a test that always passes when the bug is present, never when it's absent).
    // Coverage for "welcome has no back button" lives in onboarding-flows.spec.ts
    // ('welcome step has no back button') with a real assertion.

    test('should advance to next step when clicking Continue', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);
      // We're now on personal-info (post-welcome). h2 should read the
      // current step's label.
      await expect(page.locator('h2')).toHaveText(/sobre voc.|about you|dados\s+pessoais|personal\s+info/i, {
        timeout: 5000,
      });
      await page.locator('#fullName').fill('Test User');
      await page.locator('#phone').fill('+55 11 99999-0000');

      const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
      await Promise.all([
        page.waitForResponse(
          (r) => /\/onboarding\/session\/next\b/.test(r.url()) && r.request().method() === 'POST',
          { timeout: 10_000 },
        ),
        nextBtn.click(),
      ]);

      // After next, the user advances to `username` whose label is "Usuário".
      // `toHaveText` polls until the assertion passes — robust against the
      // POST → invalidate → GET /session → Svelte rerender chain.
      await expect(page.locator('h2')).toHaveText(/seu usu.rio|your handle|usu.rio|username/i, { timeout: 10_000 });
      await page.close();
    });

    test('should show Back button after advancing', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
      await nextBtn.click();

      const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
      await expect(backBtn).toBeVisible({ timeout: 10000 });
      await page.close();
    });

    test('should navigate back to previous step', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);
      // enterStepper lands the user on personal-info. Use the sidebar to
      // navigate to username deterministically (no field-fill / next-advance
      // race against Svelte rerender). Then click Back — which is purely a
      // server `previous` step navigation — and assert we're back at
      // personal-info.
      const usernameBtn = page.locator('aside button[data-step-id="username"]');
      await expect(usernameBtn).toBeVisible({ timeout: 10_000 });
      await Promise.all([
        page.waitForResponse(
          (r) => /\/onboarding\/session\/goto\b/.test(r.url()) && r.request().method() === 'POST',
          { timeout: 10_000 },
        ),
        usernameBtn.click(),
      ]);
      await expect(page.locator('h2')).toHaveText(/seu usu.rio|your handle|usu.rio|username/i, { timeout: 15_000 });

      const backBtn = page.getByRole('button', { name: /voltar|back/i });
      await expect(backBtn).toBeEnabled({ timeout: 10_000 });
      await Promise.all([
        page.waitForResponse(
          (r) => /\/onboarding\/session\/previous\b/.test(r.url()) && r.request().method() === 'POST',
          { timeout: 10_000 },
        ),
        backBtn.click(),
      ]);
      await expect(page.locator('h2')).toHaveText(/sobre voc.|about you|dados\s+pessoais|personal\s+info/i, {
        timeout: 15_000,
      });

      await page.close();
    });

    test('should render step content even when no dynamic fields exist', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const stepTitle = await page.locator('h2').textContent();
      expect(stepTitle?.length).toBeGreaterThan(0);

      const nextBtn = page
        .locator('button')
        .filter({ hasText: /continuar|continue|concluir|complete/i });
      await expect(nextBtn).toBeVisible();

      await page.close();
    });

    test('should bind input values on form steps', async () => {
      const page = await authContext.newPage();
      await enterStepper(page);

      const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
      await nextBtn.click();
      await page.waitForTimeout(2000);

      const input = page.locator('input').first();
      if (await input.isVisible()) {
        await input.fill('E2E Value');
        const value = await input.inputValue();
        expect(value).toBe('E2E Value');
      }
      await page.close();
    });
  });
});
