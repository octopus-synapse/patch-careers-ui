import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { loginAs, STANDARD_USER_CREDENTIALS } from '../_helpers/auth';

// Chat needs TWO real users (sender + recipient). Both seeded fixtures
// (`enzo@patchcareers.local` and `e2e-test@profile.local`) are already
// verified + onboarded, so they pass the OnboardingGuard. We log in as
// enzo and search for the seeded `e2e-test` user by display name.
const RECIPIENT_DISPLAY_NAME = 'E2E Test User';

let ctx1: BrowserContext;

async function attachConsentInitScript(ctx: BrowserContext): Promise<void> {
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
    ctx1 = await loginAs(browser, STANDARD_USER_CREDENTIALS, {
      viewport: { width: 375, height: 667 },
    });
    await attachConsentInitScript(ctx1);
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
    // Seeded recipient display name; chat user-search matches on
    // `name` and the seeded e2e-test user is unique by that handle.
    await page.locator('input[placeholder*="earch"]').fill(RECIPIENT_DISPLAY_NAME);
    await page.waitForTimeout(1000);

    await expect(page.getByText(RECIPIENT_DISPLAY_NAME).first()).toBeVisible({ timeout: 5000 });

    await page.close();
  });

  test('clicking search result starts conversation and opens it', async () => {
    const page = await ctx1.newPage();

    const logs: string[] = [];
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));

    await openChatWidget(page);

    await page.locator('input[placeholder*="earch"]').fill(RECIPIENT_DISPLAY_NAME);
    await page.waitForTimeout(1000);

    await page.getByText(RECIPIENT_DISPLAY_NAME).first().click();

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
    await page.getByText(RECIPIENT_DISPLAY_NAME).first().click();
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10000 });

    // Send message
    await page.locator('textarea').fill('Hello from e2e!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Message should appear in thread. Use `.first()` because consecutive runs
    // of this serial spec accumulate duplicate "Hello from e2e!" rows in the
    // backend's conversation history — strict-mode would otherwise reject.
    await expect(page.getByText('Hello from e2e!').first()).toBeVisible({ timeout: 5000 });

    await page.close();
  });
});
