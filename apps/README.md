# `apps/`

Workspace-level container for runnable applications.

| Project    | PR    | Purpose                                            |
| ---------- | ----- | -------------------------------------------------- |
| `apps/client` | PR #6 | Expo Router universal app (iOS + Android + RN Web) |

The monorepo intentionally ships with a single universal app. Web-only
surfaces (admin dashboards, recruiter portal, etc.) are out of scope for
the MVP per `_bmad-output/v2-plan.md`.

Nx projects defined here are discovered automatically by the
`@nx/expo` / `@nx/js/typescript` inference plugins declared in `nx.json`.

## `apps/client` quick reference

- **Routing**: Expo Router file-based, entry at `src/app/_layout.tsx`
- **Tabs**: `src/app/(tabs)/` — Jobs · Resume · Profile · Applications · Notifications
- **Theming**: Tamagui (`tamagui.config.ts`) — light/dark themes from
  `@patch-careers/tokens`, auto-follow system color scheme
- **State**: TanStack React Query + Zustand stores from
  `@patch-careers/state` (PR #4)
- **Build**: `pnpm nx run client:start` (Metro), `pnpm nx run client:serve`
  (web dev), `pnpm nx run client:export` (production bundle)
- **EAS**: `apps/client/eas.json` — `development`, `preview`, `production`
  profiles aligned with EAS Update channels
- **Deep links**: scheme `patchcareers://` + Universal Links from
  `https://patchcareers.com/*`
