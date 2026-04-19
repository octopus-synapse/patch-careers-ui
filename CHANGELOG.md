# Changelog

## [0.0.2] - 2026-04-19

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

## [0.0.1] - initial baseline
