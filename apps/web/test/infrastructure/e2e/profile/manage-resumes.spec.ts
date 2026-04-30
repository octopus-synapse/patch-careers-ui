import { expect, test } from '@playwright/test';

/**
 * Regression: the list endpoint GET /api/v1/resumes returns the lean
 * ResumeListItemDto (no `resumeSections`, `fullName`, `jobTitle`, `summary`,
 * `template`). The UI used to read `.resumeSections.length` directly,
 * which throws "Cannot read properties of undefined (reading 'length')"
 * whenever the user actually has at least one resume.
 *
 * This test logs in as a bulk-seed power user (which has a real resume
 * persisted) and asserts the page renders without the error-boundary
 * overlay. Auth helper is inline because this suite doesn't yet have a
 * shared one.
 */

const SEED_POWER_USER = {
  email: 'seed+2@patchcareers-seed.local',
  password: 'SeedUser123!',
};

test.describe('Manage Resumes page', () => {
  test('renders for a user with a real resume, no error overlay', async ({ page }) => {
    // Log in
    await page.goto('/identity/sign-in');
    await page.waitForLoadState('networkidle');
    await page.locator('input[type="email"]').fill(SEED_POWER_USER.email);
    await page.locator('input[type="password"]').fill(SEED_POWER_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.endsWith('/identity/sign-in'), { timeout: 15000 });

    // Navigate to the page under test
    await page.goto('/careers/manage-resumes');
    await page.waitForLoadState('networkidle');

    // The app-wide ErrorBoundary shows "Algo deu errado." when a component throws.
    // Before the fix, reading `.resumeSections.length` on the lean DTO threw this.
    await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
    await expect(page.getByText(/cannot read properties/i)).toHaveCount(0);

    // Happy path — the page heading is visible.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
