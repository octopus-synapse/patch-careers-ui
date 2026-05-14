import { expect, test } from '@playwright/test';
import { ADMIN_CREDENTIALS, maybeLoginAs } from '../_helpers/auth';

/**
 * RBAC contract:
 *   - JOB_CREATE moved off the default `user` role and onto `recruiter`.
 *   - Admin role list in /admin/users exposes an inline <select> that
 *     fires PATCH /v1/users/manage/:id/roles.
 *
 * This spec asserts the admin UI surfaces the role select, so a regression
 * to the old "read-only role badge" page would be caught here. The
 * end-to-end MEMBER → RECRUITER → "Publicar vaga" button visibility
 * round-trip is a heavier integration test deferred to a follow-up; we
 * only assert the admin surface here.
 */

test.describe('Admin — user role inline edit', () => {
  test('/admin/users renders a Role <select> with the three role labels', async ({ browser }) => {
    const ctx = await maybeLoginAs(browser, ADMIN_CREDENTIALS);
    test.skip(!ctx, 'seed admin user missing — skip rather than fail');
    const page = await (ctx as NonNullable<typeof ctx>).newPage();

    await page.goto('/platform/admin/users');
    await page.waitForLoadState('networkidle');

    // At least one row's role cell is a select with all 3 options.
    const roleSelect = page.locator('table select').first();
    await expect(roleSelect).toBeVisible();

    const options = await roleSelect.locator('option').allInnerTexts();
    expect(options).toEqual(expect.arrayContaining(['MEMBER', 'RECRUITER', 'ADMIN']));

    await ctx?.close();
  });
});
