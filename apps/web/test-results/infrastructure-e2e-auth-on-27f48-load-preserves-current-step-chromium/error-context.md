# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/auth/onboarding-flows.spec.ts >> Onboarding Flows >> page reload preserves current step
- Location: test/infrastructure/e2e/auth/onboarding-flows.spec.ts:381:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h2')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "patchcareers" [ref=e7] [cursor=pointer]:
        - /url: /
      - button "E" [ref=e10]:
        - generic [ref=e11]: E
        - img [ref=e12]
  - main [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - heading "Crie seu currículo profissional" [level=1] [ref=e17]
        - paragraph [ref=e18]: Em apenas 5 minutos
      - button "Começar agora →" [ref=e19]
      - paragraph [ref=e20]: Seu progresso é salvo automaticamente
```

# Test source

```ts
  1   | import { test, expect, type BrowserContext, type Page } from '@playwright/test';
  2   | 
  3   | const API_URL = 'http://localhost:3001';
  4   | const testUser = {
  5   | 	name: `E2E Flow ${Date.now()}`,
  6   | 	email: `e2e-flow-${Date.now()}@test.com`,
  7   | 	password: 'T3stP@ssw0rd!'
  8   | };
  9   | 
  10  | let authContext: BrowserContext;
  11  | 
  12  | async function createAuthenticatedContext(browser: import('@playwright/test').Browser) {
  13  | 	await fetch(`${API_URL}/api/accounts`, {
  14  | 		method: 'POST',
  15  | 		headers: { 'Content-Type': 'application/json' },
  16  | 		body: JSON.stringify(testUser)
  17  | 	});
  18  | 
  19  | 	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
  20  | 		method: 'POST',
  21  | 		headers: { 'Content-Type': 'application/json' },
  22  | 		body: JSON.stringify({ email: testUser.email, password: testUser.password })
  23  | 	});
  24  | 	const setCookie = loginRes.headers.get('set-cookie') ?? '';
  25  | 	const sessionMatch = setCookie.match(/session=([^;]+)/);
  26  | 	if (!sessionMatch) throw new Error('No session cookie returned');
  27  | 
  28  | 	const ctx = await browser.newContext();
  29  | 	await ctx.addCookies([{
  30  | 		name: 'session',
  31  | 		value: sessionMatch[1],
  32  | 		domain: 'localhost',
  33  | 		path: '/',
  34  | 		httpOnly: true,
  35  | 		sameSite: 'Lax'
  36  | 	}]);
  37  | 	return ctx;
  38  | }
  39  | 
  40  | async function waitForStep(page: Page) {
> 41  | 	await expect(page.locator('h2')).toBeVisible({ timeout: 10000 });
      |                                   ^ Error: expect(locator).toBeVisible() failed
  42  | }
  43  | 
  44  | async function getStepTitle(page: Page): Promise<string> {
  45  | 	return (await page.locator('h2').textContent()) ?? '';
  46  | }
  47  | 
  48  | async function clickNext(page: Page) {
  49  | 	const btn = page.locator('button').filter({ hasText: /continue|continuar/i });
  50  | 	await btn.click();
  51  | 	await page.waitForTimeout(1500);
  52  | }
  53  | 
  54  | async function clickBack(page: Page) {
  55  | 	const btn = page.locator('button').filter({ hasText: /back|voltar/i });
  56  | 	await btn.click();
  57  | 	await page.waitForTimeout(1500);
  58  | }
  59  | 
  60  | // Navigate via sidebar — matches partial text in any locale
  61  | async function goToStep(page: Page, labelPattern: RegExp) {
  62  | 	const sidebar = page.locator('aside');
  63  | 	const stepBtn = sidebar.locator('button').filter({ hasText: labelPattern });
  64  | 	await stepBtn.click();
  65  | 	await page.waitForTimeout(1500);
  66  | 	await waitForStep(page);
  67  | }
  68  | 
  69  | async function fillInput(page: Page, index: number, value: string) {
  70  | 	const input = page.locator('input').nth(index);
  71  | 	if (await input.isVisible()) {
  72  | 		await input.clear();
  73  | 		await input.fill(value);
  74  | 	}
  75  | }
  76  | 
  77  | // Step label patterns (match both en and pt-BR)
  78  | const STEP = {
  79  | 	WELCOME: /welcome|início/i,
  80  | 	PERSONAL: /personal|pessoais/i,
  81  | 	USERNAME: /username|usuário/i,
  82  | 	PROFILE: /profile|perfil/i,
  83  | 	EXPERIENCE: /experience|experiência/i,
  84  | 	EDUCATION: /education|educação/i,
  85  | 	SKILLS: /skills|habilidades/i,
  86  | 	LANGUAGES: /languages|idiomas/i,
  87  | 	THEME: /theme|tema/i,
  88  | 	REVIEW: /review|revisão/i,
  89  | 	DONE: /done|pronto/i,
  90  | };
  91  | 
  92  | test.describe('Onboarding Flows', () => {
  93  | 	test.beforeAll(async ({ browser }) => {
  94  | 		authContext = await createAuthenticatedContext(browser);
  95  | 	});
  96  | 
  97  | 	test.afterAll(async () => {
  98  | 		await authContext?.close();
  99  | 	});
  100 | 
  101 | 	// ── Personal Info ───────────────────────────────────────────────
  102 | 
  103 | 	test('personal info blocks advance without required fields', async () => {
  104 | 		const page = await authContext.newPage();
  105 | 		await page.setViewportSize({ width: 1280, height: 800 });
  106 | 		await page.goto('/onboarding');
  107 | 		await waitForStep(page);
  108 | 
  109 | 		await goToStep(page, STEP.PERSONAL);
  110 | 		const titleBefore = await getStepTitle(page);
  111 | 
  112 | 		await clickNext(page);
  113 | 		const titleAfter = await getStepTitle(page);
  114 | 		expect(titleAfter).toBe(titleBefore);
  115 | 
  116 | 		await page.close();
  117 | 	});
  118 | 
  119 | 	test('personal info advances with name and email', async () => {
  120 | 		const page = await authContext.newPage();
  121 | 		await page.setViewportSize({ width: 1280, height: 800 });
  122 | 		await page.goto('/onboarding');
  123 | 		await waitForStep(page);
  124 | 
  125 | 		await goToStep(page, STEP.PERSONAL);
  126 | 
  127 | 		await fillInput(page, 0, 'Maria Silva');
  128 | 		await fillInput(page, 1, 'maria@test.com');
  129 | 
  130 | 		const titleBefore = await getStepTitle(page);
  131 | 		await clickNext(page);
  132 | 		const titleAfter = await getStepTitle(page);
  133 | 		expect(titleAfter).not.toBe(titleBefore);
  134 | 
  135 | 		await page.close();
  136 | 	});
  137 | 
  138 | 	test('personal info phone and location are optional', async () => {
  139 | 		const page = await authContext.newPage();
  140 | 		await page.setViewportSize({ width: 1280, height: 800 });
  141 | 		await page.goto('/onboarding');
```