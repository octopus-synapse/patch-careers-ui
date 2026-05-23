# patch-careers-ui (V2)

Universal-app monorepo for the candidate-facing surface of
patch-careers. One codebase ships iOS, Android, and the public web
landing from `apps/app` (Expo Router + React Native Web), with shared
primitives, design tokens, i18n, state, storage, auth and the
backend SDK living in `packages/*`.

This is the V2 tree. The V1 SvelteKit app was removed in a big-bang
cutover (see `_bmad-output/v2-decisions.md` decision **D49**); the
roadmap that brings each package and app online lives in
`_bmad-output/v2-plan.md`.

## Stack

| Layer                | V2                                                                |
| -------------------- | ----------------------------------------------------------------- |
| Runtime / package mgr| Node >=20.11 + **pnpm 9** (workspaces)                            |
| Build graph          | **Nx 22** with Crystal inference (`@nx/js`, `@nx/react`, `@nx/expo`) |
| Universal app        | **Expo Router + React Native + RN Web** (Metro for native, Metro web for SSR) |
| UI primitives        | **Tamagui** (`packages/ui`, lands in PR #8)                       |
| SDK                  | **Kubb**-generated React Query hooks + Zod schemas (`packages/api-client`, PR #5) |
| State                | Zustand + persist (`packages/state`, PR #4)                       |
| Storage              | Universal KV — MMKV / SecureStore / localStorage (`packages/storage`, PR #4) |
| i18n                 | `createTranslator` + Intl wrappers (`packages/i18n`, PR #4)       |
| Lint / format        | **Biome 2**                                                       |
| TypeScript           | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `verbatimModuleSyntax` |

The legacy stack (Bun, Turbo, SvelteKit, Svelte Query SDK, Sass) is
gone — see PR #1 commits for the cutover diff.

## Repo layout

```
.
├── apps/                       # runnable applications (currently empty; apps/app lands in PR #6)
│   └── README.md
├── packages/                   # shared libraries (currently empty; populated PR #4/#5/#8)
│   └── README.md
├── nx.json                     # Nx targets, namedInputs, Crystal inference
├── tsconfig.base.json          # strict TS config every project extends
├── tsconfig.json               # workspace solution config (references: [])
├── pnpm-workspace.yaml         # apps/* and packages/*
├── biome.json                  # lint + format
├── .github/workflows/          # CI (Nx affected) and Release (release-please)
└── .husky/                     # pre-commit (biome + nx typecheck) and commit-msg (commitlint)
```

`apps/README.md` and `packages/README.md` list the projects that will
land in each subdirectory and the PR that brings them online.

## Getting started

```sh
# Use the pinned pnpm via Corepack (recommended)
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Install workspace deps
pnpm install
```

### Common commands

| Goal                         | Command                                       |
| ---------------------------- | --------------------------------------------- |
| Lint + format check (Biome)  | `pnpm lint`                                   |
| Apply lint/format fixes      | `pnpm lint:fix`                               |
| Typecheck every project      | `pnpm typecheck`                              |
| Run all tests                | `pnpm test`                                   |
| Build all buildable projects | `pnpm build`                                  |
| Run any Nx target            | `pnpm nx run <project>:<target>`              |
| Run a target across the graph| `pnpm nx run-many -t <target> --parallel=3`   |
| Only what changed vs main    | `pnpm nx affected -t <target>`                |
| Visualise the project graph  | `pnpm graph` (opens `nx graph` in browser)    |

Nx caches everything (`build`, `test`, `lint`, `typecheck`) — first
run hydrates the local cache in `.nx/cache`. The cache key is
sensitive to `biome.json`, `tsconfig.base.json` and `pnpm-lock.yaml`
(declared in `nx.json` `sharedGlobals`).

### Adding a project

1. Create the project under `apps/<name>` or `packages/<name>`.
2. Add a `package.json`, `tsconfig.json` (extending
   `../../tsconfig.base.json`) and a `project.json` only if you need
   to override the inferred targets.
3. `pnpm install` to wire it into the workspace.
4. Nx picks the project up automatically — confirm with
   `pnpm graph`.

## CI

`.github/workflows/ci.yml` runs Biome lint and `nx affected -t
typecheck test build` on PRs and `nx run-many` on pushes to `main`.
Release-please continues to drive versioning via the shared
`octopus-synapse/octopus-workflows` callable workflows; the V1
SvelteKit Docker build step is gone (the universal app ships via
EAS Build, scaffolded in PR #20).

## Plans and decisions

- `_bmad-output/v2-plan.md` — the PR-by-PR roadmap from this scaffold
  to feature-parity with V1.
- `_bmad-output/v2-decisions.md` — architectural decisions (D1…D49+)
  with rationale: why pnpm over Bun (D1), why Nx over Turbo, why
  Expo Universal over a separate web app, why big-bang cutover (D49),
  etc.
- `_bmad-output/uncle-bob-review.md` — clean-architecture review
  notes that informed the package boundaries.

These live in the sibling `patch-careers-files/_bmad-output/` tree
(referenced here relatively as `../_bmad-output/`); they intentionally
do not ship with the repo.
