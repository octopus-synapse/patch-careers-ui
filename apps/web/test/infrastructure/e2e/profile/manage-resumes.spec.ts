import { expect, test } from '@playwright/test';
import { loginAs, STANDARD_USER_CREDENTIALS } from '../_helpers/auth';

/**
 * Regression: the list endpoint GET /api/v1/resumes returns the lean
 * ResumeListItemDto (no `resumeSections`, `fullName`, `jobTitle`, `summary`,
 * `template`). The UI used to read `.resumeSections.length` directly,
 * which throws "Cannot read properties of undefined (reading 'length')"
 * whenever the user actually has at least one resume.
 *
 * Logs in as the seeded `enzoferracini` fixture — already onboarded with a
 * real persisted resume (`enzoferracini.seed.ts`) — and asserts the page
 * renders without the error-boundary overlay.
 */

test.describe('Manage Resumes page', () => {
  test('renders for a user with a real resume, no error overlay', async ({ browser }) => {
    const ctx = await loginAs(browser, STANDARD_USER_CREDENTIALS);
    const page = await ctx.newPage();

    await page.goto('/careers/manage-resumes');
    await page.waitForLoadState('networkidle');

    // The app-wide ErrorBoundary shows "Algo deu errado." when a component throws.
    // Before the fix, reading `.resumeSections.length` on the lean DTO threw this.
    await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
    await expect(page.getByText(/cannot read properties/i)).toHaveCount(0);

    // Happy path — the page heading is visible.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await ctx.close();
  });
});
