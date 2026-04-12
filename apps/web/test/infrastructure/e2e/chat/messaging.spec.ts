import { test, expect, type BrowserContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';

const user1 = { name: 'Chat User 1', email: `chat1-${Date.now()}@test.com`, password: 'T3stP@ssw0rd!' };
const user2 = { name: 'Chat User 2', email: `chat2-${Date.now()}@test.com`, password: 'T3stP@ssw0rd!' };

let ctx1: BrowserContext;

async function createUser(user: typeof user1) {
	const res = await fetch(`${API_URL}/api/accounts`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(user)
	});
	return (await res.json()).data?.userId as string;
}

async function loginContext(browser: import('@playwright/test').Browser, user: typeof user1) {
	const loginRes = await fetch(`${API_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: user.email, password: user.password })
	});
	const match = (loginRes.headers.get('set-cookie') ?? '').match(/session=([^;]+)/);
	if (!match) throw new Error('No session cookie');
	const ctx = await browser.newContext();
	await ctx.addCookies([{ name: 'session', value: match[1], domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
	return ctx;
}

test.describe.configure({ mode: 'serial' });

test.describe('Messaging', () => {
	test.beforeAll(async ({ browser }) => {
		await createUser(user1);
		await createUser(user2);
		ctx1 = await loginContext(browser, user1);
	});

	test.afterAll(async () => { await ctx1?.close(); });

	test('messages page loads with empty state', async () => {
		const page = await ctx1.newPage();
		await page.goto('/messages');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('input[placeholder*="earch"]')).toBeVisible({ timeout: 10000 });

		await page.close();
	});

	test('search finds users by name', async () => {
		const page = await ctx1.newPage();
		await page.goto('/messages');
		await page.waitForLoadState('networkidle');

		await page.locator('input[placeholder*="earch"]').fill('Chat User');
		await page.waitForTimeout(1000);

		// Should show search results dropdown
		const resultText = page.getByText('Chat User 2').first();
		await expect(resultText).toBeVisible({ timeout: 5000 });

		await page.close();
	});

	test('clicking search result starts conversation and opens it', async () => {
		const page = await ctx1.newPage();

		// Capture console for debugging
		const logs: string[] = [];
		page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

		await page.goto('/messages');
		await page.waitForLoadState('networkidle');

		await page.locator('input[placeholder*="earch"]').fill('Chat User 2');
		await page.waitForTimeout(1000);

		await page.getByText('Chat User 2').first().click();

		// Wait for the mutation to complete and conversation to open
		await page.waitForTimeout(5000);

		// Check if textarea appeared (conversation opened)
		const hasTextarea = await page.locator('textarea').isVisible();

		if (!hasTextarea) {
			console.log('All logs:', logs.filter(l => l.includes('[chat]')));
		}

		expect(hasTextarea).toBe(true);

		await page.close();
	});

	test('conversation appears in list after creating', async () => {
		const page = await ctx1.newPage();
		await page.goto('/messages');
		await page.waitForLoadState('networkidle');

		// Previous test created a conversation — it should show in the sidebar
		// The 👋 message should appear as last message preview
		await expect(page.getByText('👋').first()).toBeVisible({ timeout: 10000 });

		await page.close();
	});

	test('can send and see a message', async () => {
		const page = await ctx1.newPage();
		await page.goto('/messages');
		await page.waitForLoadState('networkidle');

		// Click existing conversation
		await page.getByText('Chat User 2').first().click();
		await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

		// Send message
		await page.locator('textarea').fill('Hello from e2e!');
		await page.locator('button[type="submit"]').click();
		await page.waitForTimeout(2000);

		// Message should appear in thread
		await expect(page.getByText('Hello from e2e!')).toBeVisible({ timeout: 5000 });

		await page.close();
	});
});
