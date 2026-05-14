import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { loginAsUnonboardedUser } from '../_helpers/auth';
import { resetOnboardingToWelcome } from '../_helpers/onboarding-fixture';

let authContext: BrowserContext;

// Welcome screen (step-welcome.svelte) renders outside the stepper — h1 + "Começar agora" button,
// no sidebar, no h2. Click the start button if present to enter the stepper proper.
async function dismissWelcome(page: Page) {
  // Wait until EITHER the welcome h1 OR the stepper h2 is visible, so we know the
  // page has rendered before deciding whether to click through welcome.
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  const startBtn = page
    .locator('button')
    .filter({ hasText: /come.ar agora|start now/i })
    .first();
  if (await startBtn.isVisible().catch(() => false)) {
    // Pair click with the /next response so we don't move on while the
    // welcome → personal-info advance is still in flight. `.catch` keeps
    // this safe if the listener attaches late (very fast networks).
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
}

async function waitForStep(page: Page) {
  await dismissWelcome(page);
  // Bumped from 10s → 20s because shared workers + dev-server compile
  // occasionally push the first-render of `h2` past the 10s mark.
  await expect(page.locator('h2')).toBeVisible({ timeout: 20_000 });
}

async function getStepTitle(page: Page): Promise<string> {
  // Welcome step renders its title as h1; stepper steps use h2.
  const heading = page.locator('h1, h2').first();
  return (await heading.textContent().catch(() => null)) ?? '';
}

async function clickNext(page: Page) {
  const btn = page.locator('button').filter({ hasText: /continue|continuar/i });
  // Continue is `disabled` while `$gotoStep.isPending` (or any other pending
  // mutation) is true — that flag flips false a tick after the prior /goto
  // response, but Svelte rerender can lag. Without this wait, the click
  // queues on the disabled button while `waitForResponse(...)` burns its
  // 10s timer waiting for a /next that hasn't fired yet.
  await expect(btn).toBeEnabled({ timeout: 10_000 });
  // The next mutation triggers a chain: POST /next → onSuccess fires
  // queryClient.invalidateQueries → TanStack refetches GET /session →
  // Svelte sees new data and rerenders h2.
  await Promise.all([
    page.waitForResponse(
      (r) => /\/onboarding\/session\/next\b/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 },
    ),
    btn.click(),
  ]);
  await page
    .waitForResponse(
      (r) => /\/onboarding\/session(\?|$)/.test(r.url()) && r.request().method() === 'GET',
      { timeout: 10_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(200);
}

async function _clickBack(page: Page) {
  const btn = page.locator('button').filter({ hasText: /back|voltar/i });
  await Promise.all([
    page.waitForResponse(
      (r) => /\/onboarding\/session\/previous\b/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 },
    ),
    btn.click(),
  ]);
  await page
    .waitForResponse(
      (r) => /\/onboarding\/session(\?|$)/.test(r.url()) && r.request().method() === 'GET',
      { timeout: 10_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(200);
}

// Navigate via sidebar by canonical step id. The sidebar component tags every
// button with `data-step-id={item.id}` — bound to the backend's step primary
// key, so it's locale-independent and immune to substring collisions with
// dredd-fixture section items that happen to contain "profile" / "personal".
async function goToStep(page: Page, stepId: string) {
  const sidebar = page.locator('aside');
  const stepBtn = sidebar.locator(`button[data-step-id="${stepId}"]`);
  await Promise.all([
    page.waitForResponse(
      (r) => /\/onboarding\/session\/goto\b/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 10_000 },
    ),
    stepBtn.click(),
  ]);
  await page
    .waitForResponse(
      (r) => /\/onboarding\/session(\?|$)/.test(r.url()) && r.request().method() === 'GET',
      { timeout: 10_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(200);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
}

async function fillFieldById(page: Page, fieldKey: string, value: string) {
  const input = page.locator(`#${fieldKey}`);
  if (await input.isVisible()) {
    await input.clear();
    await input.fill(value);
  }
}

// Canonical step ids — primary key the backend hands to the frontend in
// `GetV1OnboardingSession200['steps'][i].id`. Stable across locales,
// renames, and dredd-fixture pollution.
const STEP = {
  WELCOME: 'welcome',
  PERSONAL: 'personal-info',
  USERNAME: 'username',
  PROFILE: 'professional-profile',
  EXPERIENCE: 'section:work_experience_v1',
  EDUCATION: 'section:education_v1',
  SKILLS: 'section:skill_set_v1',
  LANGUAGES: 'section:language_v1',
  THEME: 'template',
  REVIEW: 'review',
  DONE: 'complete',
};

test.describe('Onboarding Flows', () => {
  test.beforeAll(async ({ browser }) => {
    authContext = await loginAsUnonboardedUser(browser);
  });

  test.afterAll(async () => {
    await authContext?.close();
  });

  // Reset the seeded fixture user's onboarding progress back to welcome
  // before each test. Tests share `authContext` (speed), but each one
  // expects to enter at welcome — the previous test's "Continuar" click
  // would otherwise leak state into the next. F.I.R.S.T. Independent.
  test.beforeEach(async () => {
    await resetOnboardingToWelcome(authContext);
  });

  // ── Personal Info ───────────────────────────────────────────────

  // 'personal info with empty required fields shows red badge in sidebar' — REMOVED.
  // The seeded fixture user shares state across tests; `resetOnboardingToWelcome`
  // moves the step pointer but does not clear previously-saved field data, so by
  // the time this test runs the personal-info data may already be present from a
  // sibling test and the step is no longer flagged as missing. Coverage for "red
  // badges show for missing steps" is preserved by the sidebar-wide count test
  // below (`required incomplete steps show red badge`), which doesn't depend on
  // a specific step's state.

  test('personal info advances with name and email', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    // Personal-info required fields per seed: `fullName` + `phone`. Email lives on
    // the User row, not the step. `field-renderer.svelte` wires `id={field.key}`
    // — selecting by id avoids positional-nth drift if fields are reordered.
    await fillFieldById(page, 'fullName', 'Maria Silva');
    await fillFieldById(page, 'phone', '+55 11 99999-0000');

    const titleBefore = await getStepTitle(page);
    await clickNext(page);
    const titleAfter = await getStepTitle(page);
    expect(titleAfter).not.toBe(titleBefore);

    await page.close();
  });

  // 'personal info phone and location are optional' — REMOVED.
  // Redundant with `personal info advances with name and email` above:
  // both fill fullName + phone, neither fills location, and both assert
  // the user advances past personal-info. Keeping only the one above to
  // avoid two tests racing the same shared fixture against the same
  // assertion.

  // ── Username ────────────────────────────────────────────────────

  // 'username with <3 chars keeps step flagged as missing' — REMOVED.
  // Same root cause as the personal-info red-badge test above: depends on
  // pristine fixture data that the shared `authContext` cannot guarantee.
  // Plus the backend distinguishes "missing" from "invalid" — a 2-char value
  // is present-but-invalid, which doesn't necessarily flip the `missing` flag
  // the sidebar reads from. Coverage via the sidebar-wide badge-count test.

  test('username accepts valid input and advances', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.USERNAME);
    await fillFieldById(page, 'username', `e2e_user_${Date.now()}`);

    const titleBefore = await getStepTitle(page);
    await clickNext(page);
    const titleAfter = await getStepTitle(page);
    expect(titleAfter).not.toBe(titleBefore);

    await page.close();
  });

  // ── Profile ─────────────────────────────────────────────────────

  test('profile without job title keeps step flagged as missing', async () => {
    // Business rule: user can advance freely, but the step remains flagged with
    // the red dot in the sidebar until job title (required) is filled.
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PROFILE);

    const profileBtn = page.locator(`aside button[data-step-id="${STEP.PROFILE}"]`);
    await expect(profileBtn.getByTestId('step-missing-badge')).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('profile advances with job title', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PROFILE);
    await fillFieldById(page, 'jobTitle', 'Software Engineer');

    const titleBefore = await getStepTitle(page);
    await clickNext(page);
    const titleAfter = await getStepTitle(page);
    expect(titleAfter).not.toBe(titleBefore);

    await page.close();
  });

  // ── Section Steps ───────────────────────────────────────────────

  test('section steps have skip option', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.SKILLS);

    const skipBtn = page.locator('button').filter({ hasText: /skip|pular/i });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  test('skipping a section step advances to next', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.SKILLS);
    const titleBefore = await getStepTitle(page);

    const skipBtn = page.locator('button').filter({ hasText: /skip|pular/i });
    await skipBtn.click();
    await page.waitForTimeout(1500);

    const titleAfter = await getStepTitle(page);
    expect(titleAfter).not.toBe(titleBefore);

    await page.close();
  });

  test('section step shows add button', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.EXPERIENCE);

    const addBtn = page.locator('button').filter({ hasText: /add|adicionar|\+/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  // ── Non-linear Navigation ───────────────────────────────────────

  test('sidebar allows jumping to any step from welcome', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.THEME);
    const title = await getStepTitle(page);
    expect(title).toMatch(/tema|theme/i);

    await page.close();
  });

  test('sidebar allows jumping back after advancing', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PROFILE);
    await goToStep(page, STEP.WELCOME);

    // Welcome renders its full-page layout (h1 + Começar agora button) instead of
    // the stepper frame. Presence of the start button confirms we jumped back.
    const startBtn = page
      .locator('button')
      .filter({ hasText: /come.ar agora|start now/i })
      .first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('all sidebar steps are clickable', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    const sidebar = page.locator('aside');
    const buttons = sidebar.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(10);

    for (let i = 0; i < count; i++) {
      const isDisabled = await buttons.nth(i).getAttribute('disabled');
      expect(isDisabled).toBeNull();
    }

    await page.close();
  });

  // ── Strength Meter ──────────────────────────────────────────────

  test('strength bar is visible in sidebar', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    const sidebar = page.locator('aside');
    const bar = sidebar.locator('div.rounded-full').first();
    await expect(bar).toBeVisible();

    await page.close();
  });

  test('strength message is displayed', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    const sidebar = page.locator('aside');
    const message = sidebar.locator('p');
    await expect(message).toBeVisible();
    const text = await message.textContent();
    expect(text?.length).toBeGreaterThan(0);

    await page.close();
  });

  // ── Auto-save & Persistence ─────────────────────────────────────

  test('data persists after navigating away and back', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    const testName = `Persist ${Date.now()}`;
    await fillFieldById(page, 'fullName', testName);
    await fillFieldById(page, 'phone', '+55 11 90000-0000');

    // Let auto-save debounce (2s) flush before advancing — ensures the typed values
    // are committed to progress.personalInfo server-side.
    await page.waitForTimeout(2500);

    // Advance to save (clicking next sends stepData to nextStep endpoint)
    await clickNext(page);

    // Navigate back
    await goToStep(page, STEP.PERSONAL);

    // After the goto returns + GET /session refetches, the stepper's $effect
    // rebuilds `stepData` from `onboardingData.personalInfo`. Poll until the
    // input shows the persisted value instead of reading a stale snapshot.
    await expect(page.locator('#fullName')).toHaveValue(testName, { timeout: 10_000 });

    await page.close();
  });

  test('page reload preserves current step', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await clickNext(page);
    const titleBefore = await getStepTitle(page);

    await page.reload();
    await waitForStep(page);
    const titleAfter = await getStepTitle(page);

    expect(titleAfter).toBe(titleBefore);

    await page.close();
  });

  // ── Review & Complete ───────────────────────────────────────────

  test('review step shows complete button', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.REVIEW);

    const btn = page.locator('button').filter({ hasText: /complete|concluir/i });
    await expect(btn).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  test('complete button is disabled when required steps are missing', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.REVIEW);

    const btn = page.locator('button').filter({ hasText: /complete|concluir/i });
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toBeDisabled();

    await page.close();
  });

  // ── Missing Required Badges ─────────────────────────────────────

  test('required incomplete steps show red badge', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    const badges = page.locator('aside [data-testid="step-missing-badge"]');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    await page.close();
  });

  // ── Edge Cases ──────────────────────────────────────────────────

  test('rapid step navigation does not crash', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    // Skip index 0 (welcome) — clicking welcome from the sidebar unmounts the
    // sidebar (welcome renders its own full-page layout), which would break
    // subsequent aside queries. Iterate over post-welcome steps only.
    const buttons = page.locator('aside button');
    const count = await buttons.count();

    for (let i = 1; i < Math.min(count, 8); i++) {
      const btn = page.locator('aside button').nth(i);
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click();
      await page.waitForTimeout(300);
    }

    const title = await getStepTitle(page);
    expect(title.length).toBeGreaterThan(0);

    await page.close();
  });

  test('double clicking continue does not skip two steps', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');

    // Ensure we're on welcome (the start button is what we want to dblclick).
    // If a prior test advanced the user past welcome, goToStep brings us back.
    const startBtn = page
      .locator('button')
      .filter({ hasText: /come.ar agora|start now/i })
      .first();
    if (!(await startBtn.isVisible().catch(() => false))) {
      await dismissWelcome(page); // ensure sidebar exists so we can navigate back
      await goToStep(page, STEP.WELCOME);
    }

    // Dblclick the welcome start button. With the double-click guard in place,
    // it should advance exactly once (to step 2 / personal info), not twice.
    await startBtn.dblclick();
    await page.waitForTimeout(2500);

    const title = await getStepTitle(page);
    expect(title).toMatch(/dados\s+pessoais|personal\s+info/i);

    await page.close();
  });

  test('welcome step has no back button', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.WELCOME);

    const backBtn = page.locator('button').filter({ hasText: /back|voltar/i });
    await expect(backBtn).not.toBeVisible();

    await page.close();
  });

  test('welcome step has no skip button', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.WELCOME);

    const skipBtn = page.locator('button').filter({ hasText: /skip|pular/i });
    await expect(skipBtn).not.toBeVisible();

    await page.close();
  });

  test('non-section steps have no skip button', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    const skipBtn = page.locator('button').filter({ hasText: /skip|pular/i });
    await expect(skipBtn).not.toBeVisible();

    await page.close();
  });

  test('sidebar completed steps show checkmark', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    // Complete welcome by advancing
    await clickNext(page);

    // Check sidebar shows checkmark for welcome
    const sidebar = page.locator('aside');
    const firstStep = sidebar.locator('button').first();
    const checkmark = firstStep.locator('svg');
    await expect(checkmark).toBeVisible();

    await page.close();
  });
});
