# PR2 — Bug-report sweep, P1 stabilization

Closes the P1 (priority-1) follow-ups identified in the F3 bug report
across the frontend (apps/web), the kubb SDK boundary (packages/api-client),
and the i18n dictionaries (packages/i18n). PR1 carried the P0 hot-fixes;
PR2 is the long tail of safety / SSR / UX / state-isolation issues.

Reference for human review — not consumed by tooling.

## Waves (chronology)

- **W2.1 (UI surface)** — LinkButton + useInterval primitives, P1 #1–#12.
- **W2.2 (codemod)** — inline-style → Tailwind sweep; 146 `style="..."`
  + 5 `<style>` blocks removed; baseline gate added; visual-regression
  todo deferred (see W2.5 close-out below).
- **W2.3 (semantics)** — confirm() → ConfirmModal (1st pass), `{#each}`
  keys, role-label alignment, 2FA disable route, OfflineBanner i18n.
- **W2.4 (state isolation)** — secureStorage + me-dashboard context
  factory; multi-user CSR session safety; feed-engagement try/catch
  + revert.
- **W2.5 (stabilization)** — confirm() finish (5 sites), button+goto
  finish (5 sites), step-review test fix, 401 → secureStorage cleanup,
  CLAUDE.md primitives section, final baselines.

## P1s closed (33 / 33)

| #   | Title                                                  | Wave  | Commit (prefix) |
|-----|--------------------------------------------------------|-------|-----------------|
| #1  | OfflineBanner unwired                                  | 2.3   | d09e8c29        |
| #2  | LinkButton primitive                                   | 2.1   | 8aab7cf8        |
| #3  | Button+goto → LinkButton/`<a>`                          | 2.1, 2.5 | bb5c9a0d, b52495bd |
| #4  | Disable 2FA wrong endpoint                             | 2.3   | d113b1d6        |
| #5  | useInterval rune helper                                | 2.1   | 7dbfbc48        |
| #6  | Native confirm() → ConfirmModal                        | 2.3, 2.5 | 471da3f8, 23a4e477 |
| #7  | `{#each}` missing keys (mutable lists)                 | 2.3   | 865b9bc0        |
| #8  | notification-bell uses `<button>`, not `<div role>`    | 2.1   | 1dead8e5        |
| #9  | verifyEmail flow await goto + invalidate ordering      | 2.1   | 32a23941        |
| #10 | MessageThread {#key activeId} in /social/messages      | 2.1   | 02f27396        |
| #11 | username debounced check skips initial empty value     | 2.1   | 5ead5a4c        |
| #12 | additional {#each} key cases                           | 2.3   | 865b9bc0        |
| #13 | onboarding-stepper resets stepData via untrack         | 2.3   | c6633a34        |
| #14 | OfflineBanner extracted PT strings                     | 2.3   | d09e8c29        |
| #15 | two-factor PT strings                                  | 2.3   | d09e8c29        |
| #16 | admin users role labels USER/RECRUITER/ADMIN aligned   | 2.3   | 8105963b        |
| #17 | manage-resumes thumbnail state-driven hide             | 2.3   | 35cb7f2e        |
| #18 | skills tabs shadow                                     | 2.3   | 8105963b        |
| #19 | cv-rerender-modal cancels in-flight setTimeout         | 2.3   | b0d9479c        |
| #20 | hooks: replaceAll '%lang%' covers all occurrences      | 2.2   | 6f068a6e        |
| #21 | i18n: tighten isLocale signature                       | 2.2   | f5c11bd3        |
| #22 | Accept-Language q-values parsing (RFC-7231)            | 2.2   | 618e4840        |
| #23 | path-traversal defense in SDK path params (P0 origin)  | PR1   | 8501f377        |
| #24 | use-form-draft consumes secureStorage                  | 2.4   | ec2437cf        |
| #25 | preserve statusCode when error JSON parse fails        | 2.2   | a53f5987        |
| #26 | SDK Accept-Language via provider, no document.cookie   | 2.2   | c13e0bc1        |
| #27 | default AbortController per query, cancel on unmount   | 2.2   | 38391202        |
| #28 | use-feed-engagement bookmark/unbookmark try/catch+revert| 2.4  | 7c6c0f21        |
| #29 | SSR doctrine inversion (default-on)                    | PR1   | 8501f377        |
| #30 | SSE backoff cap at 30s, start attempt=0                | 2.2   | e25c0866        |
| #31 | profile loader re-throws non-404                       | 2.2   | a9a23373        |
| #32 | me-dashboard singleton → context-based factory         | 2.4   | 745187da        |
| #33 | 401 → secureStorage cleanup interceptor                | 2.5   | 71c633c3        |

P1 #29 (SSR doctrine) and P1 #23 (path-traversal) shipped in PR1
under the same checkpoint commit; included here for completeness of
the 33-item count.

## Architectural decisions (consolidated)

- **`<LinkButton href>`** (`packages/ui/src/components/link-button/`):
  renders `<a>` when `href` is set, `<button>` otherwise. Use for
  any navigation — `goto()` should only appear in non-anchor flows
  (multi-step actions, post-mutation redirects).
- **`<ConfirmModal>`** (`packages/ui/src/components/modal/confirm-modal`):
  destructive-action gate. State pattern: `let candidate = $state(...);
  requestX() => candidate = ...; confirmX() => consume + reset`.
- **`useInterval(cb, ms)`** (apps/web/src/lib/state/use-interval.svelte.ts
  if present, otherwise `setInterval` + `onDestroy`): rune helper for
  polling; auto-cleans on unmount.
- **`useMeDashboard()`** (`apps/web/src/lib/state/me-dashboard.svelte.ts`):
  context-based factory via `setMeDashboardStore()` in `+layout.svelte`.
  No module-level singleton — multi-user CSR sessions stayed isolated.
- **`secureStorage`** (`apps/web/src/lib/utils/secure-storage.svelte.ts`):
  per-user namespaced `localStorage` (`secure:<userId>:<key>`).
  Auto-cleanup paths:
  - navbar logout button
  - settings/delete-account flow
  - any 401 the SDK fetcher sees (via `setUnauthorizedHandler` in
    `packages/api-client/src/client/fetcher.ts`, wired in `+layout.svelte`)
- **Inline-style codemod** (`scripts/codemod-inline-style-to-tw.ts` +
  `scripts/check-no-inline-style.ts`): one-shot sweep + permanent gate.
  Baseline at 0 — no new `style="..."` or `<style>` blocks may be added
  without explicit baseline update (which gate enforces).

## Baseline updates

| Baseline                                     | Before PR2 | After PR2 |
|----------------------------------------------|------------|-----------|
| `scripts/check-no-inline-style.baseline.json` | 151        |       0   |
| `scripts/check-i18n-hardcoded.baseline.json`  | 18         |      13   |
| `scripts/check-no-hardcoded-pt.baseline.json` | unchanged  |       0   |

The 13 remaining i18n-hardcoded entries are all in the dashboard
kpi widgets (`my-profile/dashboard/_components/kpi-*.svelte`) and
the danger-zone label — out of scope for PR2 because they ship
English-only strings that are pending product confirmation (PD-007:
do we localize KPI labels or keep them as canonical metric names?).

## Test suites (final)

- `apps/web` (vitest):     67 / 67 pass
- `packages/api-client`:    14 / 14 pass
- `packages/ui`:             6 /  6 pass
- biome lint:               0 errors, 18 warnings (pre-existing,
                            all in `scripts/`)

## Follow-ups (out of PR2 scope)

1. **Playwright visual-regression infrastructure** (was W2.5 commit 6
   candidate). The `inline-style-codemod.spec.ts.todo` documents the
   blockers: stable baseline image needs a CI machine (local Linux
   font/AA differs from CI Chromium), and auth-gated routes need the
   seeded backend. Promote to PR3 once the CI snapshot runner exists.
2. **`consent-store.svelte.ts`, `lockout-state.svelte.ts`,
   `color-schema.svelte.ts`** all still use `localStorage` direct
   (not secureStorage). Not PII / draft data so PR2 left them; if
   they ever store user-scoped values, migrate.
3. **`state_referenced_locally` ignores in admin/* + chat/***. Pattern
   can migrate to `createQuery({ get queryKey })` factories as in
   commit `5ead5a4c`. Cosmetic — silences a Svelte warning without
   behavior change.
4. **Drop legacy `form-draft:*` localStorage keys**. The migration
   to secureStorage in commit `ec2437cf` leaves orphan entries on
   browsers of users mid-flow. Decision (PD-008): drop on next visit
   (default) vs one-shot migrate on sign-in. PR2 left the orphans
   in place because they expire naturally with the user's session.
5. **`useMeDashboard()` consumer adoption**. Context provider is
   wired in `+layout.svelte` but no UI yet imports `useMeDashboard()`
   in place of the legacy singleton. Migrate widget-by-widget in PR3.
6. **`apps/web/src/test/mocks/app-environment.ts`** is a global alias.
   No per-test SSR override possible right now. If a future test
   needs to assert SSR-only behavior, swap the alias for a factory
   per `vitest.config.ts` setup file.
7. **`vitest` glob `src/**/*.test.ts`** still picks up
   `.svelte.test.ts` files. Works today (Svelte 5 rune files use
   `.svelte.ts`, tests use `.test.ts`) but the union is implicit;
   consider tightening to `.test.ts` + `.spec.ts` only.
8. **P0 #1 free-win — env.schema dead code**: PR1 deleted the
   `env.schema.ts` file that allowed the validation bypass; that
   change is captured in the PR1 history (commit `8501f377` and
   surrounding). No frontend code references the schema anymore.

## Pre-commit / Pre-push gates (running)

The 14-check pre-commit grid ran green for every PR2 commit:
typecheck, lint, no-any, sdk-drift, i18n-keys, i18n-orphans,
i18n-parity, i18n-missing, no-hardcoded-pt, i18n-hardcoded,
no-api-client-deep-imports, form-schema-from-sdk, file-size,
no-inline-style. Same checks run via `.husky/pre-push`.
