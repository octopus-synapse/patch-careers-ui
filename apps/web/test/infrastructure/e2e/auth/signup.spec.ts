import { test, expect } from '@playwright/test';

test.describe('Signup page', () => {
	test('should render without errors when backend is unreachable', async ({ page }) => {
		const jsErrors: string[] = [];
		const consoleErrors: string[] = [];

		page.on('pageerror', (err) => jsErrors.push(err.message));
		page.on('console', (msg) => {
			if (msg.type() === 'error') consoleErrors.push(msg.text());
		});

		const response = await page.goto('/signup');
		await page.waitForTimeout(2000);

		expect(response?.status()).toBe(200);
		expect(jsErrors).toHaveLength(0);
		const networkErrors = consoleErrors.filter(
			(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
		);
		expect(networkErrors).toHaveLength(0);
	});

	test('should display signup form with all fields', async ({ page }) => {
		await page.goto('/signup');

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('input#name')).toBeVisible();
		await expect(page.locator('input#email')).toBeVisible();
		await expect(page.locator('input#password')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should bind input values and submit form without client validation errors', async ({ page }) => {
		await page.goto('/signup');

		await page.fill('input#name', 'Test User');
		await page.fill('input#email', 'test@example.com');
		await page.fill('input#password', 'password123');

		const passwordValue = await page.inputValue('input#password');
		expect(passwordValue).toBe('password123');

		await page.click('button[type="submit"]');
		await page.waitForTimeout(500);

		const errorText = await page.locator('text=pelo menos 8 caracteres').count();
		expect(errorText).toBe(0);
	});

	test('should show navbar in unauthenticated state', async ({ page }) => {
		await page.goto('/signup');

		await expect(page.locator('nav')).toBeVisible();
		await expect(page.locator('nav a[href="/login"]')).toBeVisible();
		await expect(page.locator('nav a[href="/signup"]')).toBeVisible();
	});
});
