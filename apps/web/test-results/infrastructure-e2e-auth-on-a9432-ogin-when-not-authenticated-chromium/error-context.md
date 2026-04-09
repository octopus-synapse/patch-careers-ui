# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/onboarding.spec.ts >> Onboarding page >> Unauthenticated >> should redirect to /login when not authenticated
- Location: test/infrastructure/e2e/auth/onboarding.spec.ts:46:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/login" until "load"
============================================================
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
  1   | import { test, expect, type BrowserContext } from '@playwright/test';
  2   | 
  3   | const API_URL = 'http://localhost:3001';
  4   | const APP_URL = 'http://localhost:5173';
  5   | const testUser = {
  6   | 	name: `E2E Onboarding ${Date.now()}`,
  7   | 	email: `e2e-onboarding-${Date.now()}@test.com`,
  8   | 	password: 'T3stP@ssw0rd!'
  9   | };
  10  | 
  11  | let authContext: BrowserContext;
  12  | 
  13  | async function createAuthenticatedContext(browser: import('@playwright/test').Browser) {
  14  | 	// Create account
  15  | 	await fetch(`${API_URL}/api/accounts`, {
  16  | 		method: 'POST',
  17  | 		headers: { 'Content-Type': 'application/json' },
  18  | 		body: JSON.stringify(testUser)
  19  | 	});
  20  | 
  21  | 	// Login to get session cookie
  22  | 	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
  23  | 		method: 'POST',
  24  | 		headers: { 'Content-Type': 'application/json' },
  25  | 		body: JSON.stringify({ email: testUser.email, password: testUser.password })
  26  | 	});
  27  | 	const setCookie = loginRes.headers.get('set-cookie') ?? '';
  28  | 	const sessionMatch = setCookie.match(/session=([^;]+)/);
  29  | 	if (!sessionMatch) throw new Error('No session cookie returned');
  30  | 
  31  | 	// Create browser context with the session cookie
  32  | 	const ctx = await browser.newContext();
  33  | 	await ctx.addCookies([{
  34  | 		name: 'session',
  35  | 		value: sessionMatch[1],
  36  | 		domain: 'localhost',
  37  | 		path: '/',
  38  | 		httpOnly: true,
  39  | 		sameSite: 'Lax'
  40  | 	}]);
  41  | 	return ctx;
  42  | }
  43  | 
  44  | test.describe('Onboarding page', () => {
  45  | 	test.describe('Unauthenticated', () => {
  46  | 		test('should redirect to /login when not authenticated', async ({ page }) => {
  47  | 			await page.goto('/onboarding');
> 48  | 			await page.waitForURL('**/login', { timeout: 10000 });
      |               ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  49  | 			expect(page.url()).toContain('/login');
  50  | 		});
  51  | 	});
  52  | 
  53  | 	test.describe('Authenticated (fresh user)', () => {
  54  | 		test.beforeAll(async ({ browser }) => {
  55  | 			authContext = await createAuthenticatedContext(browser);
  56  | 		});
  57  | 
  58  | 		test.afterAll(async () => {
  59  | 			await authContext?.close();
  60  | 		});
  61  | 
  62  | 		test('should render without console errors', async () => {
  63  | 			const page = await authContext.newPage();
  64  | 			const jsErrors: string[] = [];
  65  | 			const consoleErrors: string[] = [];
  66  | 
  67  | 			page.on('pageerror', (err) => jsErrors.push(err.message));
  68  | 			page.on('console', (msg) => {
  69  | 				if (msg.type() === 'error') consoleErrors.push(msg.text());
  70  | 			});
  71  | 
  72  | 			await page.goto('/onboarding');
  73  | 			await page.waitForTimeout(3000);
  74  | 
  75  | 			expect(jsErrors).toHaveLength(0);
  76  | 			const networkErrors = consoleErrors.filter(
  77  | 				(e) => e.includes('ERR_CONNECTION') || e.includes('CORS') || e.includes('ERR_FAILED')
  78  | 			);
  79  | 			expect(networkErrors).toHaveLength(0);
  80  | 			await page.close();
  81  | 		});
  82  | 
  83  | 		test('should display onboarding title and subtitle', async () => {
  84  | 			const page = await authContext.newPage();
  85  | 			await page.goto('/onboarding');
  86  | 
  87  | 			const h1 = page.locator('h1');
  88  | 			await expect(h1).toBeVisible({ timeout: 10000 });
  89  | 			const text = await h1.textContent();
  90  | 			expect(text?.length).toBeGreaterThan(0);
  91  | 			await page.close();
  92  | 		});
  93  | 
  94  | 		test('should display sidebar with steps on desktop', async () => {
  95  | 			const page = await authContext.newPage();
  96  | 			await page.setViewportSize({ width: 1280, height: 800 });
  97  | 			await page.goto('/onboarding');
  98  | 
  99  | 			const sidebar = page.locator('aside');
  100 | 			await expect(sidebar).toBeVisible({ timeout: 10000 });
  101 | 
  102 | 			const stepButtons = sidebar.locator('button');
  103 | 			const count = await stepButtons.count();
  104 | 			expect(count).toBeGreaterThan(0);
  105 | 			await page.close();
  106 | 		});
  107 | 
  108 | 		test('should display progress bar in sidebar', async () => {
  109 | 			const page = await authContext.newPage();
  110 | 			await page.setViewportSize({ width: 1280, height: 800 });
  111 | 			await page.goto('/onboarding');
  112 | 
  113 | 			const sidebar = page.locator('aside');
  114 | 			await expect(sidebar).toBeVisible({ timeout: 10000 });
  115 | 
  116 | 			// Progress text (e.g. "0% completo")
  117 | 			const progressText = sidebar.locator('span').first();
  118 | 			await expect(progressText).toBeVisible();
  119 | 			await page.close();
  120 | 		});
  121 | 
  122 | 		test('should hide sidebar on mobile', async () => {
  123 | 			const page = await authContext.newPage();
  124 | 			await page.setViewportSize({ width: 375, height: 667 });
  125 | 			await page.goto('/onboarding');
  126 | 
  127 | 			await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  128 | 
  129 | 			const sidebar = page.locator('aside');
  130 | 			await expect(sidebar).not.toBeVisible();
  131 | 			await page.close();
  132 | 		});
  133 | 
  134 | 		test('should display current step label', async () => {
  135 | 			const page = await authContext.newPage();
  136 | 			await page.goto('/onboarding');
  137 | 
  138 | 			const stepTitle = page.locator('h2');
  139 | 			await expect(stepTitle).toBeVisible({ timeout: 10000 });
  140 | 			const text = await stepTitle.textContent();
  141 | 			expect(text?.length).toBeGreaterThan(0);
  142 | 			await page.close();
  143 | 		});
  144 | 
  145 | 		test('should display Continue button', async () => {
  146 | 			const page = await authContext.newPage();
  147 | 			await page.goto('/onboarding');
  148 | 
```