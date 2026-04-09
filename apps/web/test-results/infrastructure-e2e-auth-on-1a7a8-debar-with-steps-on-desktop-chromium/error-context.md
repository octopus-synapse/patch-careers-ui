# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/onboarding.spec.ts >> Onboarding page >> Authenticated (fresh user) >> should display sidebar with steps on desktop
- Location: test/infrastructure/e2e/auth/onboarding.spec.ts:94:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('aside')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('aside')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]: "500"
  - heading "Internal Error" [level=1] [ref=e5]
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
  48  | 			await page.waitForURL('**/login', { timeout: 10000 });
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
> 100 | 			await expect(sidebar).toBeVisible({ timeout: 10000 });
      |                          ^ Error: expect(locator).toBeVisible() failed
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
  149 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  150 | 
  151 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  152 | 			await expect(nextBtn).toBeVisible();
  153 | 			await page.close();
  154 | 		});
  155 | 
  156 | 		test('should not display Back button on first step', async () => {
  157 | 			const page = await authContext.newPage();
  158 | 			await page.goto('/onboarding');
  159 | 
  160 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  161 | 
  162 | 			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
  163 | 			await expect(backBtn).not.toBeVisible();
  164 | 			await page.close();
  165 | 		});
  166 | 
  167 | 		test('should advance to next step when clicking Continue', async () => {
  168 | 			const page = await authContext.newPage();
  169 | 			await page.goto('/onboarding');
  170 | 
  171 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  172 | 			const firstTitle = await page.locator('h2').textContent();
  173 | 
  174 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  175 | 			await nextBtn.click();
  176 | 
  177 | 			await page.waitForFunction(
  178 | 				(prev) => document.querySelector('h2')?.textContent !== prev,
  179 | 				firstTitle,
  180 | 				{ timeout: 10000 }
  181 | 			);
  182 | 
  183 | 			const secondTitle = await page.locator('h2').textContent();
  184 | 			expect(secondTitle).not.toBe(firstTitle);
  185 | 			await page.close();
  186 | 		});
  187 | 
  188 | 		test('should show Back button after advancing', async () => {
  189 | 			const page = await authContext.newPage();
  190 | 			await page.goto('/onboarding');
  191 | 
  192 | 			await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
  193 | 
  194 | 			const nextBtn = page.locator('button').filter({ hasText: /continuar|continue/i });
  195 | 			await nextBtn.click();
  196 | 
  197 | 			const backBtn = page.locator('button').filter({ hasText: /voltar|back/i });
  198 | 			await expect(backBtn).toBeVisible({ timeout: 10000 });
  199 | 			await page.close();
  200 | 		});
```