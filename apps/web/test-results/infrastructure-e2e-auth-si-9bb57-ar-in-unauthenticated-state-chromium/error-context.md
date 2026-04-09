# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/signin.spec.ts >> Signin page >> should show navbar in unauthenticated state
- Location: test/infrastructure/e2e/auth/signin.spec.ts:33:2

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
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]: "500"
    - heading "Internal Error" [level=1] [ref=e5]
  - generic [ref=e8]:
    - generic [ref=e9]: "Failed to load url /@fs/home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts (resolved id: /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts) in /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/index.ts. Does the file exist?"
    - generic [ref=e10]: "Error: Failed to load url /@fs/home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts (resolved id: /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/generated/api/index.ts) in /home/enzoferracini/Documents/Projects/profile/patch-careers-ui/packages/api-client/src/index.ts. Does the file exist? at loadAndTransform (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:35730:17) at async fetchModule (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:46883:16) at async handleInvoke (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:39026:22) at async EventEmitter.listenerForInvokeHandler (file:///home/enzoferracini/Documents/Projects/profile/patch-careers-ui/node_modules/.bun/vite@6.4.2+1f28c2829e037941/node_modules/vite/dist/node/chunks/dep-Dq2t6Dq0.js:39099:19"
    - generic [ref=e11]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e12]: server.hmr.overlay
      - text: to
      - code [ref=e13]: "false"
      - text: in
      - code [ref=e14]: vite.config.ts
      - text: .
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
  16 | 		expect(response?.status()).toBe(200);
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
> 36 | 		await expect(page.locator('nav')).toBeVisible();
     |                                     ^ Error: expect(locator).toBeVisible() failed
  37 | 		await expect(page.locator('nav a[href="/login"]')).toBeVisible();
  38 | 		await expect(page.locator('nav a[href="/signup"]')).toBeVisible();
  39 | 	});
  40 | });
  41 | 
```