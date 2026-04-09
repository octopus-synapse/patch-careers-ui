# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/signin.spec.ts >> Signin page >> should render without errors when backend is unreachable
- Location: test/infrastructure/e2e/auth/signin.spec.ts:4:2

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]: "500"
  - heading "Internal Error" [level=1] [ref=e5]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Signin page', () => {
  4  | 	test('should render without errors when backend is unreachable', async ({ page }) => {
  5  | 		const jsErrors: string[] = [];
  6  | 		const consoleErrors: string[] = [];
  7  | 
  8  | 		page.on('pageerror', (err) => jsErrors.push(err.message));
  9  | 		page.on('console', (msg) => {
  10 | 			if (msg.type() === 'error') consoleErrors.push(msg.text());
  11 | 		});
  12 | 
  13 | 		const response = await page.goto('/login');
  14 | 		await page.waitForTimeout(2000);
  15 | 
> 16 | 		expect(response?.status()).toBe(200);
     |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  17 | 		expect(jsErrors).toHaveLength(0);
  18 | 		const networkErrors = consoleErrors.filter(
  19 | 			(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
  20 | 		);
  21 | 		expect(networkErrors).toHaveLength(0);
  22 | 	});
  23 | 
  24 | 	test('should display signin form with email and password fields', async ({ page }) => {
  25 | 		await page.goto('/login');
  26 | 
  27 | 		await expect(page.locator('h1')).toBeVisible();
  28 | 		await expect(page.locator('input#email')).toBeVisible();
  29 | 		await expect(page.locator('input#password')).toBeVisible();
  30 | 		await expect(page.locator('button[type="submit"]')).toBeVisible();
  31 | 	});
  32 | 
  33 | 	test('should show navbar in unauthenticated state', async ({ page }) => {
  34 | 		await page.goto('/login');
  35 | 
  36 | 		await expect(page.locator('nav')).toBeVisible();
  37 | 		await expect(page.locator('nav a[href="/login"]')).toBeVisible();
  38 | 		await expect(page.locator('nav a[href="/signup"]')).toBeVisible();
  39 | 	});
  40 | });
  41 | 
```