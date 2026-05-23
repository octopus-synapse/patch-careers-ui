# `apps/`

Workspace-level container for runnable applications.

| Project    | PR    | Purpose                                            |
| ---------- | ----- | -------------------------------------------------- |
| `apps/app` | PR #6 | Expo Router universal app (iOS + Android + RN Web) |

The monorepo intentionally ships with a single universal app. Web-only
surfaces (admin dashboards, recruiter portal, etc.) are out of scope for
the MVP per `_bmad-output/v2-plan.md`.

Nx projects defined here are discovered automatically by the
`@nx/expo` / `@nx/js/typescript` inference plugins declared in `nx.json`.

## `apps/app` quick reference

- **Routing**: Expo Router file-based, entry at `app/_layout.tsx`
- **Tabs**: `app/(tabs)/` — Jobs · Resume · Profile · Applications · Notifications
- **Theming**: Tamagui (`tamagui.config.ts`) — light/dark themes from
  `@patch-careers/tokens`, auto-follow system color scheme
- **State**: TanStack React Query + Zustand stores from
  `@patch-careers/state` (PR #4)
- **Build**: `pnpm nx run app:start` (Metro), `pnpm nx run app:serve`
  (web dev), `pnpm nx run app:export` (production bundle)
- **EAS**: `apps/app/eas.json` — `development`, `preview`, `production`
  profiles aligned with EAS Update channels
- **Deep links**: scheme `patchcareers://` + Universal Links from
  `https://patchcareers.com/*`
