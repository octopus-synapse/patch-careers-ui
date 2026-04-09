import { test, expect } from '@playwright/test';

test.describe('Signin page', () => {
	test('should render without errors when backend is unreachable', async ({ page }) => {
		const jsErrors: string[] = [];
		const consoleErrors: string[] = [];

		page.on('pageerror', (err) => jsErrors.push(err.message));
		page.on('console', (msg) => {
			if (msg.type() === 'error') consoleErrors.push(msg.text());
		});

		const response = await page.goto('/login');
		await page.waitForTimeout(2000);

		expect(response?.status()).toBe(200);
		expect(jsErrors).toHaveLength(0);
		const networkErrors = consoleErrors.filter(
			(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
		);
		expect(networkErrors).toHaveLength(0);
	});

	test('should display signin form with email and password fields', async ({ page }) => {
		await page.goto('/login');

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input#email')).toBeVisible();
		await expect(page.locator('input#password')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should show navbar in unauthenticated state', async ({ page }) => {
		await page.goto('/login');

		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('nav a[href="/login"]')).toBeVisible();
		await expect(page.locator('nav a[href="/signup"]')).toBeVisible();
	});
});
