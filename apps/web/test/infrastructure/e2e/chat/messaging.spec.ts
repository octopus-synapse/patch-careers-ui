import { type BrowserContext, expect, type Page, test } from '@playwright/test';

const API_URL = 'http://localhost:3001';

const user1 = {
  name: 'Chat User 1',
  email: `chat1-${Date.now()}@test.com`,
  password: 'T3stP@ssw0rd!',
  acceptedTosVersion: '1.0.0',
  acceptedPrivacyVersion: '1.0.0',
};
const user2 = {
  name: 'Chat User 2',
  email: `chat2-${Date.now()}@test.com`,
  password: 'T3stP@ssw0rd!',
  acceptedTosVersion: '1.0.0',
  acceptedPrivacyVersion: '1.0.0',
};

let ctx1: BrowserContext;

async function createUser(user: typeof user1) {
  const res = await fetch(`${API_URL}/api/v1/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return (await res.json()).data?.userId as string;
}

async function loginContext(browser: import('@playwright/test').Browser, user: typeof user1) {
  const loginRes = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const match = (loginRes.headers.get('set-cookie') ?? '').match(/access_token=([^;]+)/);
  if (!match) throw new Error('No access_token cookie');
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  await ctx.addCookies([
    {
      name: 'access_token',
      value: match[1],
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  // Pre-accept cookie consent so the LGPD banner doesn't overlap the chat
  // compose on mobile viewport and intercept button clicks.
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem(
        'consent_v1',
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          version: 1,
          acceptedAt: new Date().toISOString(),
        }),
      );
    } catch {
      /* storage not available */
    }
  });
  return ctx;
}

async function openChatWidget(page: Page) {
  await page.goto('/my-profile/dashboard');
  await page.waitForLoadState('networkidle');

  // Mobile viewport: open hamburger, then click chat-toggle from the mobile menu.
  await page.locator('[data-testid="menu-toggle"]').click();
  await page.locator('[data-testid="chat-toggle"]').click();

  // Widget should now be open
  await expect(page.locator('input[placeholder*="earch"]')).toBeVisible({ timeout: 10000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Messaging', () => {
  test.beforeAll(async ({ browser }) => {
    await createUser(user1);
    await createUser(user2);
    ctx1 = await loginContext(browser, user1);
  });

  test.afterAll(async () => {
    await ctx1?.close();
  });

  test('chat widget opens with search input visible', async () => {
    const page = await ctx1.newPage();
    await openChatWidget(page);
    await page.close();
  });

  test('search finds users by name', async () => {
    const page = await ctx1.newPage();
    await openChatWidget(page);

    // Freshly created users from `/api/accounts` don't have a username yet
    // (assigned during onboarding), so we can only search by display name.
    // The backend sorts results by createdAt DESC, so this run's user2 comes
    // first despite older "Chat User 2" fixtures sharing the same name.
    await page.locator('input[placeholder*="earch"]').fill('Chat User 2');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Chat User 2').first()).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  test('clicking search result starts conversation and opens it', async () => {
    const page = await ctx1.newPage();

    const logs: string[] = [];
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

    await openChatWidget(page);

    await page.locator('input[placeholder*="earch"]').fill('Chat User 2');
    await page.waitForTimeout(1000);

    await page.getByText('Chat User 2').first().click();

    await page.waitForTimeout(5000);

    const hasTextarea = await page.locator('textarea').isVisible();

    if (!hasTextarea) {
      console.log(
        'All logs:',
        logs.filter((l) => l.includes('[chat]')),
      );
    }

    expect(hasTextarea).toBe(true);

    await page.close();
  });

  test('conversation appears in list after creating', async () => {
    const page = await ctx1.newPage();
    await openChatWidget(page);

    // Previous test created a conversation — it should show in the sidebar
    // The 👋 message should appear as last message preview
    await expect(page.getByText('👋').first()).toBeVisible({ timeout: 10000 });

    await page.close();
  });

  test('can send and see a message', async () => {
    const page = await ctx1.newPage();
    await openChatWidget(page);

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
