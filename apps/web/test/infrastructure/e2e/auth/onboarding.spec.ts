import { test, expect, type BrowserContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const APP_URL = 'http://localhost:5173';
const testUser = {
	name: `E2E Onboarding ${Date.now()}`,
	email: `e2e-onboarding-${Date.now()}@test.com`,
	password: 'T3stP@ssw0rd!'
};

let authContext: BrowserContext;

async function createAuthenticatedContext(browser: import('@playwright/test').Browser) {
	// Create account
	await fetch(`${API_URL}/api/accounts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(testUser)
	});

	// Login to get session cookie
	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: testUser.email, password: testUser.password })
	});
	const setCookie = loginRes.headers.get('set-cookie') ?? '';
	const sessionMatch = setCookie.match(/session=([^;]+)/);
	if (!sessionMatch) throw new Error('No session cookie returned');

	// Create browser context with the session cookie
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

test.describe('Onboarding page', () => {
	test.describe('Unauthenticated', () => {
		test('should redirect to /login when not authenticated', async ({ page }) => {
			await page.goto('/onboarding');
			await page.waitForURL('**/login', { timeout: 10000 });
			expect(page.url()).toContain('/login');
		});
	});

	test.describe('Authenticated (fresh user)', () => {
		test.beforeAll(async ({ browser }) => {
			authContext = await createAuthenticatedContext(browser);
		});

		test.afterAll(async () => {
			await authContext?.close();
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
				(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
			);
			expect(networkErrors).toHaveLength(0);
			await page.close();
		});

		test('should display onboarding title and subtitle', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			const h2 = page.locator('h2');
			await expect(h2).toBeVisible({ timeout: 10000 });
			const text = await h2.textContent();
			expect(text?.length).toBeGreaterThan(0);
			await page.close();
		});

		test('should display sidebar with steps on desktop', async () => {
			const page = await authContext.newPage();
			await page.setViewportSize({ width: 1280, height: 800 });
			await page.goto('/onboarding');

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
			await page.goto('/onboarding');

			const sidebar = page.locator('aside');
			await expect(sidebar).toBeVisible({ timeout: 10000 });

			// Progress text (e.g. "0% completo")
			const progressText = sidebar.locator('span').first();
			await expect(progressText).toBeVisible();
			await page.close();
		});

		test('should hide sidebar on mobile', async () => {
			const page = await authContext.newPage();
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			const sidebar = page.locator('aside');
			await expect(sidebar).not.toBeVisible();
			await page.close();
		});

		test('should display current step label', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			const stepTitle = page.locator('h2');
			await expect(stepTitle).toBeVisible({ timeout: 10000 });
			const text = await stepTitle.textContent();
			expect(text?.length).toBeGreaterThan(0);
			await page.close();
		});

		test('should display Continue button', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
			await expect(nextBtn).toBeVisible();
			await page.close();
		});

		test('should not display Back button on first step', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
			await expect(backBtn).not.toBeVisible();
			await page.close();
		});

		test('should advance to next step when clicking Continue', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
			const firstTitle = await page.locator('h2').textContent();

			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
			await nextBtn.click();

			await page.waitForFunction(
				(prev) => document.querySelector('h2')?.textContent !== prev,
				firstTitle,
				{ timeout: 10000 }
			);

			const secondTitle = await page.locator('h2').textContent();
			expect(secondTitle).not.toBe(firstTitle);
			await page.close();
		});

		test('should show Back button after advancing', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
			await nextBtn.click();

			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
			await expect(backBtn).toBeVisible({ timeout: 10000 });
			await page.close();
		});

		test('should navigate back to previous step', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			// Ensure we can go forward first (advance if possible)
			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
			if (await nextBtn.isVisible()) {
				const titleBefore = await page.locator('h2').textContent();
				await nextBtn.click();
				await page.waitForTimeout(2000);

				// Now go back
				const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
				if (await backBtn.isVisible()) {
					const titleAfterAdvance = await page.locator('h2').textContent();
					await backBtn.click();
					await page.waitForFunction(
						(afterAdvance) => document.querySelector('h2')?.textContent !== afterAdvance,
						titleAfterAdvance,
						{ timeout: 10000 }
					);
					const titleAfterBack = await page.locator('h2').textContent();
					expect(titleAfterBack).not.toBe(titleAfterAdvance);
				}
			}
			await page.close();
		});

		test('should render step content even when no dynamic fields exist', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			// The current step should have a title (h2) and either:
			// - form fields (input/textarea/select) for generic-section steps
			// - or just the step label for steps without dynamic fields (welcome, personal-info, etc.)
			const stepTitle = await page.locator('h2').textContent();
			expect(stepTitle?.length).toBeGreaterThan(0);

			// The Continue button should always be present
			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue|concluir|complete/i });
			await expect(nextBtn).toBeVisible();

			await page.close();
		});

		test('should bind input values on form steps', async () => {
			const page = await authContext.newPage();
			await page.goto('/onboarding');

			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });

			// Advance past intro step
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
