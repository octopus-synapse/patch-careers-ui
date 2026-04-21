import { redirect } from '@sveltejs/kit';

/**
 * SvelteKit `load` that issues a permanent (301) redirect to `target`.
 *
 * Used at every legacy URL after the Fase 2 reorganization moved routes
 * into product folders (`careers/`, `recruiting/`, `identity/`, `social/`,
 * `my-profile/`, `platform/`). 301 keeps SEO authority intact and tells
 * email clients/RSS/etc. to update cached links.
 *
 * @example
 *   // routes/[[lang=lang]]/login/+page.ts
 *   export const load = redirectTo('/identity/sign-in');
 */
export function redirectTo(target: string) {
  return () => {
    throw redirect(301, target);
  };
}

/**
 * Variant for catch-all redirects: forwards `/<old-prefix>/<rest>` to
 * `/<new-prefix>/<rest>`, preserving subpath and any trailing segments.
 */
export function redirectPrefix(newPrefix: string) {
  return ({ params }: { params: { rest?: string } }) => {
    const rest = params.rest ? `/${params.rest}` : '';
    throw redirect(301, `${newPrefix}${rest}`);
  };
}
