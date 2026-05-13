import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { API_URL } from '../_helpers/auth';
import { deleteMessagesFor, getLatestVerificationCode } from '../_helpers/mailpit';

/**
 * End-to-end TDD guard for the signup → verify-email → onboarding path.
 *
 * User-reported regression: "the code I pasted comes back as Invalid or
 * expired". This spec exercises the real UI — sign up a fresh account,
 * grab the *latest* code from Mailpit (same inbox a human would look at),
 * paste it into the OTP field, and assert the user lands on /onboarding
 * with no error banner and a session that reports email-verified=true.
 *
 * Runs three times in serial to catch races between sign-up's fire-and-
 * forget `sendVerification.mutate()` and the user pasting on the next
 * screen. Uses a single paste (not key-by-key typing) because keystroke
 * typing races with focus transitions between OTP slots — that's an
 * artifact of the test harness, not of the product code.
 */
test.describe.configure({ mode: 'serial' });

async function signUp(page: import('@playwright/test').Page): Promise<string> {
  const id = randomUUID().slice(0, 8);
  const email = `e2e-verify-ui-${id}@test.com`;

  await deleteMessagesFor(email).catch(() => {});
  await page.goto('/identity/sign-up');
  await page.waitForLoadState('networkidle');

  await page.locator('input#name').fill(`E2E Verify ${id}`);
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill('T3stP@ssw0rd!');
  await page.locator('input[type="checkbox"]').first().check();
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL(/identity\/verify-email/, { timeout: 15_000 });
  return email;
}

async function pasteOtp(page: import('@playwright/test').Page, code: string): Promise<void> {
  const firstSlot = page.locator('input[inputmode="numeric"]').first();
  await firstSlot.waitFor({ state: 'visible', timeout: 5_000 });
  await firstSlot.focus();
  await page.evaluate((c) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', c);
    (document.activeElement as HTMLElement | null)?.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  }, code);
}

for (const run of [1, 2, 3]) {
  test(`fresh signup #${run} — paste code from Mailpit → land on onboarding`, async ({ page }) => {
    const email = await signUp(page);
    const code = await getLatestVerificationCode(email, { timeoutMs: 15_000 });

    await pasteOtp(page, code);
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

    // Backend must have flipped emailVerified in the session response.
    const session = await page.request.get(`${API_URL}/api/v1/auth/session`);
    const body = (await session.json()) as {
      user: { emailVerified: boolean; needsEmailVerification: boolean };
    };
    expect(body.user.emailVerified).toBe(true);
    expect(body.user.needsEmailVerification).toBe(false);

    // No "Invalid or expired" banner after a successful verify.
    await expect(page.getByText(/invalid.*(expired|token)|inválid/i)).toHaveCount(0);

    await deleteMessagesFor(email).catch(() => {});
  });
}
