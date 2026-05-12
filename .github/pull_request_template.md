<!--
  Keep this file in sync with profile-services/.github/pull_request_template.md.
  Both are deliberately the same — the cross-repo invariants matter on every PR.
-->

## Summary

<!-- 1–3 bullets describing what changed and why. Link the audit Q-code if relevant. -->

## Cross-repo impact

- [ ] Backend untouched — pure frontend change
- [ ] Backend change required first, SDK regenerated here
  - [ ] `bun run sdk:generate` ran in `packages/api-client`
  - [ ] `.swagger-hash` updated (pre-commit drift gate passes)
  - [ ] Backend PR merged before this PR: <!-- https://github.com/octopus-synapse/profile-services/pull/NNN -->
- [ ] No deep imports into `api-client/src/generated/**`
  (`lint-no-api-client-deep-imports` passes)

## UI / UX changes

- [ ] No visual change
- [ ] Visual change — screenshot / Loom attached
- [ ] Locale parity: every new copy string lives in `@packages/i18n`
      (both `en` and `pt-BR`); `check-i18n-keys` + `lint-unused-i18n` +
      `check-no-hardcoded-pt` all pass
- [ ] No `<style>` block or `style="..."` inline (Tailwind utilities only)
- [ ] Component placement decision documented if non-obvious:
      `packages/ui` (cross-app), `lib/components` (cross-route), or
      `_components/` (single area)

## Destructive operations checklist

Tick every line that applies. Each is something a reviewer needs to think
about before approving — leave unticked if not applicable.

- [ ] **State loss risk:** TanStack Query cache invalidation pattern
      reviewed (no manual `setQueryData` that diverges from the
      authoritative server state)
- [ ] **Storage:** LocalStorage / cookie writes documented (key, TTL,
      consent gating)
- [ ] **Feature flag:** gated behind a flag that defaults OFF
- [ ] **Rollback plan:** static asset rollback only (no DB), or noted
- [ ] **Accessibility:** keyboard nav + screen-reader labels checked
- [ ] **Lockout interceptor:** new 409 codes wired into
      `lockout-state.svelte.ts` if applicable

## Test plan

- [ ] `bun run check` (typecheck) green
- [ ] `bunx biome check .` (lint) green
- [ ] `bun run test` (Vitest in apps/web) green
- [ ] E2E updated if a user-facing flow changed
- [ ] Manual smoke test in the browser at `localhost:5173`
      (mention which routes were exercised)

## Notes for reviewer

<!-- Anything that needs a second pair of eyes specifically. Leave blank if nothing. -->
