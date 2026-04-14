# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: infrastructure/e2e/chat/messaging.spec.ts >> Messaging >> messages page loads with empty state
- Location: test/infrastructure/e2e/chat/messaging.spec.ts:43:2

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[placeholder*="earch"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input[placeholder*="earch"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "patchcareers" [ref=e7] [cursor=pointer]:
          - /url: /
        - button "C" [ref=e10]:
          - generic [ref=e11]: C
          - img [ref=e12]
    - main [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - heading "Crie seu currículo profissional" [level=1] [ref=e17]
          - paragraph [ref=e18]: Em apenas 5 minutos
        - button "Começar agora →" [ref=e19]
        - paragraph [ref=e20]: Seu progresso é salvo automaticamente
  - generic [ref=e21]: Onboarding
```

# Test source

```ts
  1   | import { test, expect, type BrowserContext } from '@playwright/test';
  2   | 
  3   | const API_URL = 'http://localhost:3001';
  4   | 
  5   | const user1 = { name: 'Chat User 1', email: `chat1-${Date.now()}@test.com`, password: 'T3stP@ssw0rd!' };
  6   | const user2 = { name: 'Chat User 2', email: `chat2-${Date.now()}@test.com`, password: 'T3stP@ssw0rd!' };
  7   | 
  8   | let ctx1: BrowserContext;
  9   | 
  10  | async function createUser(user: typeof user1) {
  11  | 	const res = await fetch(`${API_URL}/api/accounts`, {
  12  | 		method: 'POST',
  13  | 		headers: { 'Content-Type': 'application/json' },
  14  | 		body: JSON.stringify(user)
  15  | 	});
  16  | 	return (await res.json()).data?.userId as string;
  17  | }
  18  | 
  19  | async function loginContext(browser: import('@playwright/test').Browser, user: typeof user1) {
  20  | 	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
  21  | 		method: 'POST',
  22  | 		headers: { 'Content-Type': 'application/json' },
  23  | 		body: JSON.stringify({ email: user.email, password: user.password })
  24  | 	});
  25  | 	const match = (loginRes.headers.get('set-cookie') ?? '').match(/session=([^;]+)/);
  26  | 	if (!match) throw new Error('No session cookie');
  27  | 	const ctx = await browser.newContext();
  28  | 	await ctx.addCookies([{ name: 'session', value: match[1], domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  29  | 	return ctx;
  30  | }
  31  | 
  32  | test.describe.configure({ mode: 'serial' });
  33  | 
  34  | test.describe('Messaging', () => {
  35  | 	test.beforeAll(async ({ browser }) => {
  36  | 		await createUser(user1);
  37  | 		await createUser(user2);
  38  | 		ctx1 = await loginContext(browser, user1);
  39  | 	});
  40  | 
  41  | 	test.afterAll(async () => { await ctx1?.close(); });
  42  | 
  43  | 	test('messages page loads with empty state', async () => {
  44  | 		const page = await ctx1.newPage();
  45  | 		await page.goto('/messages');
  46  | 		await page.waitForLoadState('networkidle');
  47  | 
> 48  | 		await expect(page.locator('input[placeholder*="earch"]')).toBeVisible({ timeout: 10000 });
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  49  | 
  50  | 		await page.close();
  51  | 	});
  52  | 
  53  | 	test('search finds users by name', async () => {
  54  | 		const page = await ctx1.newPage();
  55  | 		await page.goto('/messages');
  56  | 		await page.waitForLoadState('networkidle');
  57  | 
  58  | 		await page.locator('input[placeholder*="earch"]').fill('Chat User');
  59  | 		await page.waitForTimeout(1000);
  60  | 
  61  | 		// Should show search results dropdown
  62  | 		const resultText = page.getByText('Chat User 2').first();
  63  | 		await expect(resultText).toBeVisible({ timeout: 5000 });
  64  | 
  65  | 		await page.close();
  66  | 	});
  67  | 
  68  | 	test('clicking search result starts conversation and opens it', async () => {
  69  | 		const page = await ctx1.newPage();
  70  | 
  71  | 		// Capture console for debugging
  72  | 		const logs: string[] = [];
  73  | 		page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  74  | 
  75  | 		await page.goto('/messages');
  76  | 		await page.waitForLoadState('networkidle');
  77  | 
  78  | 		await page.locator('input[placeholder*="earch"]').fill('Chat User 2');
  79  | 		await page.waitForTimeout(1000);
  80  | 
  81  | 		await page.getByText('Chat User 2').first().click();
  82  | 
  83  | 		// Wait for the mutation to complete and conversation to open
  84  | 		await page.waitForTimeout(5000);
  85  | 
  86  | 		// Check if textarea appeared (conversation opened)
  87  | 		const hasTextarea = await page.locator('textarea').isVisible();
  88  | 
  89  | 		if (!hasTextarea) {
  90  | 			console.log('All logs:', logs.filter(l => l.includes('[chat]')));
  91  | 		}
  92  | 
  93  | 		expect(hasTextarea).toBe(true);
  94  | 
  95  | 		await page.close();
  96  | 	});
  97  | 
  98  | 	test('conversation appears in list after creating', async () => {
  99  | 		const page = await ctx1.newPage();
  100 | 		await page.goto('/messages');
  101 | 		await page.waitForLoadState('networkidle');
  102 | 
  103 | 		// Previous test created a conversation — it should show in the sidebar
  104 | 		// The 👋 message should appear as last message preview
  105 | 		await expect(page.getByText('👋').first()).toBeVisible({ timeout: 10000 });
  106 | 
  107 | 		await page.close();
  108 | 	});
  109 | 
  110 | 	test('can send and see a message', async () => {
  111 | 		const page = await ctx1.newPage();
  112 | 		await page.goto('/messages');
  113 | 		await page.waitForLoadState('networkidle');
  114 | 
  115 | 		// Click existing conversation
  116 | 		await page.getByText('Chat User 2').first().click();
  117 | 		await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });
  118 | 
  119 | 		// Send message
  120 | 		await page.locator('textarea').fill('Hello from e2e!');
  121 | 		await page.locator('button[type="submit"]').click();
  122 | 		await page.waitForTimeout(2000);
  123 | 
  124 | 		// Message should appear in thread
  125 | 		await expect(page.getByText('Hello from e2e!')).toBeVisible({ timeout: 5000 });
  126 | 
  127 | 		await page.close();
  128 | 	});
  129 | });
  130 | 
```