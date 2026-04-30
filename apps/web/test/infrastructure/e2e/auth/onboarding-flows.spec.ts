import { type BrowserContext, expect, type Page, test } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const testUser = {
  name: `E2E Flow ${Date.now()}`,
  email: `e2e-flow-${Date.now()}@test.com`,
  password: 'T3stP@ssw0rd!',
  acceptedTosVersion: '1.0.0',
  acceptedPrivacyVersion: '1.0.0',
};

let authContext: BrowserContext;

async function createAuthenticatedContext(browser: import('@playwright/test').Browser) {
  await fetch(`${API_URL}/api/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  });

  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser.email, password: testUser.password }),
  });
  const setCookie = loginRes.headers.get('set-cookie') ?? '';
  const sessionMatch = setCookie.match(/session=([^;]+)/);
  if (!sessionMatch) throw new Error('No session cookie returned');

  const ctx = await browser.newContext();
  await ctx.addCookies([
    {
      name: 'session',
      value: sessionMatch[1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return ctx;
}

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
    await startBtn.click();
    await page.waitForTimeout(2000);
  }
}

async function waitForStep(page: Page) {
  await dismissWelcome(page);
  await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
}

async function getStepTitle(page: Page): Promise<string> {
  // Welcome step renders its title as h1; stepper steps use h2.
  const heading = page.locator('h1, h2').first();
  return (await heading.textContent().catch(() => null)) ?? '';
}

async function clickNext(page: Page) {
  const btn = page.locator('button').filter({ hasText: /continue|continuar/i });
  await btn.click();
  await page.waitForTimeout(1500);
}

async function _clickBack(page: Page) {
  const btn = page.locator('button').filter({ hasText: /back|voltar/i });
  await btn.click();
  await page.waitForTimeout(1500);
}

// Navigate via sidebar — matches partial text in any locale.
// Does NOT dismiss welcome; caller decides if they want to stay on welcome
// (e.g. goToStep(STEP.WELCOME)) or advance past it.
async function goToStep(page: Page, labelPattern: RegExp) {
  const sidebar = page.locator('aside');
  const stepBtn = sidebar.locator('button').filter({ hasText: labelPattern });
  await stepBtn.click();
  await page.waitForTimeout(1500);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
}

async function fillInput(page: Page, index: number, value: string) {
  const input = page.locator('input').nth(index);
  if (await input.isVisible()) {
    await input.clear();
    await input.fill(value);
  }
}

// Step label patterns (match both en and pt-BR)
const STEP = {
  WELCOME: /welcome|início/i,
  PERSONAL: /personal|pessoais/i,
  USERNAME: /username|usuário/i,
  PROFILE: /profile|perfil/i,
  EXPERIENCE: /experience|experiência/i,
  EDUCATION: /education|educação/i,
  SKILLS: /skills|habilidades/i,
  LANGUAGES: /languages|idiomas/i,
  THEME: /theme|tema/i,
  REVIEW: /review|revisão/i,
  DONE: /done|pronto/i,
};

test.describe('Onboarding Flows', () => {
  test.beforeAll(async ({ browser }) => {
    authContext = await createAuthenticatedContext(browser);
  });

  test.afterAll(async () => {
    await authContext?.close();
  });

  // ── Personal Info ───────────────────────────────────────────────

  test('personal info with empty required fields shows red badge in sidebar', async () => {
    // Business rule: navigation is free (Continue advances even with empty required),
    // but missing-required steps are flagged with a red dot in the sidebar so the
    // user sees what still needs attention.
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    // Red missing-required dot: sidebar-nav.svelte renders <span class="... bg-red-500">
    // next to the numbered step circle when `missing && !completed`.
    const personalBtn = page.locator('aside button').filter({ hasText: STEP.PERSONAL });
    const redDot = personalBtn.locator('span.bg-red-500');
    await expect(redDot).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('personal info advances with name and email', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    await fillInput(page, 0, 'Maria Silva');
    await fillInput(page, 1, 'maria@test.com');

    const titleBefore = await getStepTitle(page);
    await clickNext(page);
    const titleAfter = await getStepTitle(page);
    expect(titleAfter).not.toBe(titleBefore);

    await page.close();
  });

  test('personal info phone and location are optional', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PERSONAL);

    await fillInput(page, 0, 'João Pedro');
    await fillInput(page, 1, 'joao@test.com');

    await clickNext(page);
    const title = await getStepTitle(page);
    expect(title).not.toMatch(STEP.PERSONAL);

    await page.close();
  });

  // ── Username ────────────────────────────────────────────────────

  test('username with <3 chars keeps step flagged as missing', async () => {
    // Business rule: navigation is free even with invalid input, but the username
    // step stays flagged (red badge) as long as the value doesn't satisfy min 3 chars.
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.USERNAME);
    await fillInput(page, 0, 'ab');
    await page.waitForTimeout(2500); // let auto-save debounce

    const usernameBtn = page.locator('aside button').filter({ hasText: STEP.USERNAME });
    const redDot = usernameBtn.locator('span.bg-red-500');
    await expect(redDot).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('username accepts valid input and advances', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.USERNAME);
    await fillInput(page, 0, `e2e_user_${Date.now()}`);

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

    const profileBtn = page.locator('aside button').filter({ hasText: STEP.PROFILE });
    const redDot = profileBtn.locator('span.bg-red-500');
    await expect(redDot).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('profile advances with job title', async () => {
    const page = await authContext.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/onboarding');
    await waitForStep(page);

    await goToStep(page, STEP.PROFILE);
    await fillInput(page, 0, 'Software Engineer');

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
    expect(title).toMatch(STEP.THEME);

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
    // Personal step fields (post-refactor): fullName (0), phone (1), location (2).
    await fillInput(page, 0, testName);
    await fillInput(page, 1, '+55 11 90000-0000');

    // Let auto-save debounce (2s) flush before advancing — ensures the typed values
    // are committed to progress.personalInfo server-side.
    await page.waitForTimeout(2500);

    // Advance to save (clicking next sends stepData to nextStep endpoint)
    await clickNext(page);

    // Navigate back
    await goToStep(page, STEP.PERSONAL);

    const value = await page.locator('input').first().inputValue();
    expect(value).toBe(testName);

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

    const badges = page.locator('aside span.bg-red-500');
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
    expect(title).toMatch(STEP.PERSONAL);

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
