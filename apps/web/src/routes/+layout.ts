// P0-#24: SSR doctrine inversion.
//
// The app previously defaulted to `ssr = false` globally, which sabotaged
// every SEO/share-preview surface (sitemap, public profile, jobs detail,
// feed post permalink) and forced even a logged-out user to wait for JS
// to render the empty shell. The team-decided trade-off is to default to
// SSR and opt OUT per-route only when a leaf is intrinsically client-only
// (e.g. depends on `localStorage`, draws on a `<canvas>` only in browser,
// or needs `window` before paint).
//
// Migration plan:
//   - Default = SSR enabled (this file).
//   - Routes that genuinely need CSR-only set `export const ssr = false;`
//     in their own +layout.ts / +page.ts.
//   - Routes that already declared `ssr = true` keep working (no-op now).
//
// See apps/web/CLAUDE.md for the updated doctrine.
export const ssr = true;
