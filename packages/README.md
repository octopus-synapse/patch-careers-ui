# `packages/`

Workspace-level container for shared libraries consumed by `apps/*`.
Empty in PR #1 — V2 packages land here in later PRs:

| Package                       | PR    | Purpose                                                                       |
| ----------------------------- | ----- | ----------------------------------------------------------------------------- |
| `@patch-careers/tokens`       | PR #4 | Design tokens + Tamagui config (colors, spacing, typography, themes)          |
| `@patch-careers/i18n`         | PR #4 | `createTranslator` + Intl wrappers; dictionaries re-exported from api-client  |
| `@patch-careers/storage`      | PR #4 | Universal KV storage (MMKV/SecureStore on mobile, localStorage on web)        |
| `@patch-careers/state`        | PR #4 | Zustand stores + persist middleware (locale, colorScheme, consent)            |
| `@patch-careers/api-client`   | PR #5 | Kubb-generated SDK (React Query hooks, Zod schemas, dictionaries, error codes)|
| `@patch-careers/auth`         | PR #5 | Login / refresh / OAuth helpers + auth Zustand store                          |
| `@patch-careers/ui`           | PR #8 | Tamagui-based primitives and compounds (universal Button, Sheet, Toast, etc.) |

All packages are pure libraries (no Expo/RN imports in `tokens` and
`i18n`); the universal app composes them.

Nx projects defined here are discovered automatically by the
`@nx/js/typescript` inference plugin declared in `nx.json`.
