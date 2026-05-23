# `contracts/`

Holds the JSON contract artefacts synced from `profile-services` and
consumed by:

- `kubb.config.ts` (reads `client-swagger.json` to drive codegen)
- `scripts/post-kubb.ts` (reads `dictionaries.json` / `enums.json` /
  `error-codes.json` to emit typed TS modules into `src/generated/`)

Files:

| File                  | Source                                       | Updated by                           |
| --------------------- | -------------------------------------------- | ------------------------------------ |
| `client-swagger.json` | `profile-services/client-swagger.json`       | `_sync-contracts.yml` (CI) or manual |
| `dictionaries.json`   | `profile-services/dictionaries.json`         | `_sync-contracts.yml` (CI) or manual |
| `enums.json`          | `profile-services/enums.json`                | `_sync-contracts.yml` (CI) or manual |
| `error-codes.json`    | `profile-services/error-codes.json`          | `_sync-contracts.yml` (CI) or manual |

Locally, you can refresh by running `bun run swagger:generate` in the
`profile-services` repo and copying the four files here, then running
`pnpm sdk:generate`. The CI workflow does the same thing automatically
and opens a PR.

Do not hand-edit these files — they are overwritten on every sync.
