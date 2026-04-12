import { test, expect, type BrowserContext, type Page } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const testUser = {
	name: `E2E Flow ${Date.now()}`,
	email: `e2e-flow-${Date.now()}@test.com`,
	password: 'T3stP@ssw0rd!'
};

let authContext: BrowserContext;

async function createAuthenticatedContext(browser: import('@playwright/test').Browser) {
	await fetch(`${API_URL}/api/accounts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(testUser)
	});

	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: testUser.email, password: testUser.password })
	});
	const setCookie = loginRes.headers.get('set-cookie') ?? '';
	const sessionMatch = setCookie.match(/session=([^;]+)/);
	if (!sessionMatch) throw new Error('No session cookie returned');

	const ctx = await browser.newContext();
	await ctx.addCookies([{
		name: 'session',
		value: sessionMatch[1],
		domain: 'localhost',
		path: '/',
		httpOnly: true,
		sameSite: 'Lax'
	}]);
	return ctx;
}

async function waitForStep(page: Page) {
	await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
}

async function getStepTitle(page: Page): Promise<string> {
	return (await page.locator('h2').textContent()) ?? '';
}

async function clickNext(page: Page) {
	const btn = page.locator('button').filter({ hasText: /continue|continuar/i });
	await btn.click();
	await page.waitForTimeout(1500);
}

async function clickBack(page: Page) {
	const btn = page.locator('button').filter({ hasText: /back|voltar/i });
	await btn.click();
	await page.waitForTimeout(1500);
}

// Navigate via sidebar — matches partial text in any locale
async function goToStep(page: Page, labelPattern: RegExp) {
	const sidebar = page.locator('aside');
	const stepBtn = sidebar.locator('button').filter({ hasText: labelPattern });
	await stepBtn.click();
	await page.waitForTimeout(1500);
	await waitForStep(page);
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

	test('personal info blocks advance without required fields', async () => {
		const page = await authContext.newPage();
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/onboarding');
		await waitForStep(page);

		await goToStep(page, STEP.PERSONAL);
		const titleBefore = await getStepTitle(page);

		await clickNext(page);
		const titleAfter = await getStepTitle(page);
		expect(titleAfter).toBe(titleBefore);

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

	test('username blocks advance with less than 3 chars', async () => {
		const page = await authContext.newPage();
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/onboarding');
		await waitForStep(page);

		await goToStep(page, STEP.USERNAME);
		await fillInput(page, 0, 'ab');

		const titleBefore = await getStepTitle(page);
		await clickNext(page);
		const titleAfter = await getStepTitle(page);
		expect(titleAfter).toBe(titleBefore);

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

	test('profile blocks advance without job title', async () => {
		const page = await authContext.newPage();
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/onboarding');
		await waitForStep(page);

		await goToStep(page, STEP.PROFILE);

		const titleBefore = await getStepTitle(page);
		await clickNext(page);
		const titleAfter = await getStepTitle(page);
		expect(titleAfter).toBe(titleBefore);

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

		const title = await getStepTitle(page);
		expect(title).toMatch(STEP.WELCOME);

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
		expect(text!.length).toBeGreaterThan(0);

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
		await fillInput(page, 0, testName);
		await fillInput(page, 1, 'persist@test.com');

		// Advance to save (clicking next saves the data)
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

		const buttons = page.locator('aside button');
		const count = await buttons.count();

		for (let i = 0; i < Math.min(count, 8); i++) {
			await buttons.nth(i).click();
			await page.waitForTimeout(200);
		}

		const title = await getStepTitle(page);
		expect(title.length).toBeGreaterThan(0);

		await page.close();
	});

	test('double clicking continue does not skip two steps', async () => {
		const page = await authContext.newPage();
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/onboarding');
		await waitForStep(page);

		// Start from welcome
		await goToStep(page, STEP.WELCOME);
		await waitForStep(page);

		const nextBtn = page.locator('button').filter({ hasText: /continue|continuar/i });
		await nextBtn.dblclick();
		await page.waitForTimeout(2000);

		// Should be on step 2 (personal info), not step 3 (username)
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
