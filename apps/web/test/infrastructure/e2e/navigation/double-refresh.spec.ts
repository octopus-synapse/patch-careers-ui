import { test, expect } from '@playwright/test';

test.describe('Double refresh bug', () => {
	const pages = ['/', '/test-404'];

	for (const path of pages) {
		test(`page ${path} survives two consecutive F5 refreshes`, async ({ page }) => {
			const consoleErrors: string[] = [];
			const failedRequests: string[] = [];

			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					consoleErrors.push(msg.text());
				}
			});

			page.on('requestfailed', (req) => {
				failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
			});

			// Step 1: Initial navigation
			await page.goto(path, { waitUntil: 'networkidle' });
			await page.waitForTimeout(500);

			const bodyBefore = await page.locator('body').innerHTML();
			expect(bodyBefore.length).toBeGreaterThan(0);
			await page.screenshot({ path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step1-initial.png` });

			// Step 2: First F5 refresh
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForTimeout(500);

			const bodyAfterFirst = await page.locator('body').innerHTML();
			expect(bodyAfterFirst.length).toBeGreaterThan(0);
			await page.screenshot({ path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step2-first-refresh.png` });

			// Step 3: Second F5 refresh (this is where the bug occurred)
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForTimeout(1000);

			const bodyAfterSecond = await page.locator('body').innerHTML();
			expect(bodyAfterSecond.length).toBeGreaterThan(0);
			await page.screenshot({ path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step3-second-refresh.png` });

			// Step 4: Third refresh for good measure
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForTimeout(1000);

			const bodyAfterThird = await page.locator('body').innerHTML();
			expect(bodyAfterThird.length).toBeGreaterThan(0);
			await page.screenshot({ path: `test-results/double-refresh-${path.replace(/\//g, '_')}-step4-third-refresh.png` });

			// Verify no critical console errors
			const criticalErrors = consoleErrors.filter(
				(e) => e.includes('Failed to fetch') || e.includes('ChunkLoadError') || e.includes('TypeError')
			);
			expect(criticalErrors).toEqual([]);

			// Verify no failed network requests
			expect(failedRequests).toEqual([]);
		});
	}

	test('Cache-Control header is set to no-store for HTML pages', async ({ request }) => {
		const response = await request.get('/');
		const cacheControl = response.headers()['cache-control'];
		expect(cacheControl).toBe('no-store');
	});

	test('page does not go blank after rapid consecutive refreshes', async ({ page }) => {
		const consoleErrors: string[] = [];

		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		await page.goto('/test-404', { waitUntil: 'networkidle' });

		// Rapid-fire 5 reloads
		for (let i = 0; i < 5; i++) {
			await page.reload({ waitUntil: 'networkidle' });
			await page.waitForTimeout(200);
		}

		// After all reloads, page should still render
		await page.waitForTimeout(1000);
		const heading = page.locator('h1');
		await expect(heading).toBeVisible({ timeout: 5000 });

		const text = await heading.textContent();
		expect(text).toBe('Test Page');
	});
});
