# `apps/`

Workspace-level container for runnable applications. Empty in PR #1 — V2
projects land here in later PRs:

| Project       | PR    | Purpose                                              |
| ------------- | ----- | ---------------------------------------------------- |
| `apps/app`    | PR #6 | Expo Router universal app (iOS + Android + RN Web)   |

The monorepo intentionally ships with a single universal app. Web-only
surfaces (admin dashboards, recruiter portal, etc.) are out of scope for
the MVP per `_bmad-output/v2-plan.md`.

Nx projects defined here are discovered automatically by the
`@nx/expo` / `@nx/js/typescript` inference plugins declared in `nx.json`.
