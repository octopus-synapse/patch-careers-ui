# Changelog

## [0.0.1] - 2026-04-19

First tagged release of `apps/web`.

### Changed

- CI/CD migrated to `@octopus-synapse/octopus-workflows@v1` (-1450 LOC).
- Pre-commit pipeline collapsed from 175 to 3 lines, matrix externalised
  to `.precommit.yaml`.
- `biome.json` and `commitlint.config.ts` extend shared configs; only
  ui-specific overrides stay local.

### Fixed

- Onboarding: render generic-section steps as multi-items, drop the
  fields requirement that blocked progression on multi-item sections.

### Build / CI

- Backend reference for E2E pinned to the seed-on-main migration.
- Multiple CI retriggers across `octopus-workflows` v1.3.x point
  releases (typst, prisma generate, npmrc, package visibility,
  health-check).
- Release workflow guard relaxed (`startsWith` → `contains` + allow
  `workflow_dispatch`) so the finalize step doesn't get skipped when
  the release PR is merged with "Create a merge commit".
