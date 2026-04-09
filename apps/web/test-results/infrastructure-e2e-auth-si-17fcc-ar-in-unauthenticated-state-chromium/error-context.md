# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/signup.spec.ts >> Signup page >> should show navbar in unauthenticated state
- Location: test/infrastructure/e2e/auth/signup.spec.ts:51:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav')

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
  3  | test.describe('Signup page', () => {
  4  | 	test('should render without errors when backend is unreachable', async ({ page }) => {
  5  | 		const jsErrors: string[] = [];
  6  | 		const consoleErrors: string[] = [];
  7  | 
  8  | 		page.on('pageerror', (err) => jsErrors.push(err.message));
  9  | 		page.on('console', (msg) => {
  10 | 			if (msg.type() === 'error') consoleErrors.push(msg.text());
  11 | 		});
  12 | 
  13 | 		const response = await page.goto('/signup');
  14 | 		await page.waitForTimeout(2000);
  15 | 
  16 | 		expect(response?.status()).toBe(200);
  17 | 		expect(jsErrors).toHaveLength(0);
  18 | 		const networkErrors = consoleErrors.filter(
  19 | 			(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
  20 | 		);
  21 | 		expect(networkErrors).toHaveLength(0);
  22 | 	});
  23 | 
  24 | 	test('should display signup form with all fields', async ({ page }) => {
  25 | 		await page.goto('/signup');
  26 | 
  27 | 		await expect(page.locator('h1')).toBeVisible();
  28 | 		await expect(page.locator('input#name')).toBeVisible();
  29 | 		await expect(page.locator('input#email')).toBeVisible();
  30 | 		await expect(page.locator('input#password')).toBeVisible();
  31 | 		await expect(page.locator('button[type="submit"]')).toBeVisible();
  32 | 	});
  33 | 
  34 | 	test('should bind input values and submit form without client validation errors', async ({ page }) => {
  35 | 		await page.goto('/signup');
  36 | 
  37 | 		await page.fill('input#name', 'Test User');
  38 | 		await page.fill('input#email', 'test@example.com');
  39 | 		await page.fill('input#password', 'password123');
  40 | 
  41 | 		const passwordValue = await page.inputValue('input#password');
  42 | 		expect(passwordValue).toBe('password123');
  43 | 
  44 | 		await page.click('button[type="submit"]');
  45 | 		await page.waitForTimeout(500);
  46 | 
  47 | 		const errorText = await page.locator('text=pelo menos 8 caracteres').count();
  48 | 		expect(errorText).toBe(0);
  49 | 	});
  50 | 
  51 | 	test('should show navbar in unauthenticated state', async ({ page }) => {
  52 | 		await page.goto('/signup');
  53 | 
> 54 | 		await expect(page.locator('nav')).toBeVisible();
     |                                     ^ Error: expect(locator).toBeVisible() failed
  55 | 		await expect(page.locator('nav a[href="/login"]')).toBeVisible();
  56 | 		await expect(page.locator('nav a[href="/signup"]')).toBeVisible();
  57 | 	});
  58 | });
  59 | 
```