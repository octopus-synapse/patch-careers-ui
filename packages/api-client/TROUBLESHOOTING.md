# SDK Regen Troubleshooting

Quick reference when `bun run sdk:generate` fails. Walk through in order; stop at first hit.

## 1. `client-swagger.json: ENOENT`

```
Error: ENOENT: no such file or directory, '...client-swagger.json'
```

**Cause**: `profile-services` repo not checked out alongside `patch-careers-ui`.

**Fix**: drift gate reads via relative path `../profile-services/client-swagger.json`. Clone the backend repo as sibling:

```sh
cd $(dirname $(pwd))  # parent of patch-careers-ui
git clone git@github.com:octopus-synapse/profile-services.git
# Then retry sdk:generate
```

## 2. Spectral violations in `client-swagger.json`

```
Error: ... violates @stoplight/spectral rules ...
```

**Cause**: backend route declaration produced an OpenAPI spec that fails the Spectral ruleset.

**Fix**: run Spectral manually to see all violations:

```sh
cd ../profile-services
bun run lint:spec
# Fix violating route file in profile-services
bun run swagger:generate
# Commit + push backend PR first; then return here
```

## 3. Kubb crash mid-generation

```
[KubbError] cannot read property 'XYZ' of undefined
```

**Cause**: usually a schema shape Kubb can't lower (recursive Zod, custom transforms, etc.).

**Fix steps**:

1. Re-run with debug logging:
   ```sh
   KUBB_LOG_LEVEL=debug bun run sdk:generate 2>&1 | tee kubb-debug.log
   ```
2. Inspect `src/generated/` for partial output — files written before crash hint at the failing schema.
3. Bisect: comment-out routes/operations in `profile-services/client-swagger.json` to isolate the breaking spec. (Don't commit; just locate.)
4. If patched plugin (`kubb-plugin-svelte-query-patched`) is suspect: temporarily swap to upstream `@kubb/plugin-svelte-query@4.37.5` in `kubb.config.ts`. If crash disappears, file issue in patched plugin.
5. If neither helps: open issue on https://github.com/kubb-labs/kubb with debug log + offending schema snippet.

## 4. Drift hash mismatch after regen

```
SDK hash mismatch: ../profile-services/client-swagger.json was modified after last sdk:generate
```

**Cause**: `client-swagger.json` updated in `profile-services` after you ran `sdk:generate`.

**Fix**: re-run regen:

```sh
bun run sdk:generate  # rewrites .swagger-hash with current hash
git add src/generated/ src/generated/.swagger-hash
```

## 5. Type errors in generated code after regen

```
src/generated/hooks/XYZ.ts: TS2322 Type 'XYZ' is not assignable to ...
```

**Cause**: backend changed a shape; Kubb regenerated; downstream callers (in `apps/web` or other packages) reference the old shape.

**Fix**:

1. `bun run check` in `packages/api-client` to confirm SDK itself compiles clean.
2. `bun run check` in `apps/web` (or each consumer workspace) to see caller errors.
3. Refactor callers to the new shape. **No `as any` / `as unknown as X`** — fix the type properly.
4. Both SDK regen + caller refactor go in the **same PR** (sterile cockpit policy).

## 6. `swagger.json` has new routes but `client-swagger.json` doesn't

**Cause**: backend's `route-coverage` check missed some routes when generating the client subset.

**Fix**: in `profile-services`, run:

```sh
SDK_COVERAGE_MODE=error bun run src/scripts/validate-swagger-coverage.ts
```

This will fail with the list of uncovered routes. Add OpenAPI tags / sdk-coverage hints in the route files until they're picked up.

---

## When to escalate

- After 30 minutes of bisecting Kubb crashes with no progress.
- Spectral violation that requires backend redesign (e.g., requires breaking change to client contract).
- Drift gate failing in CI but works locally — likely environment difference; capture logs.

## Related files

- `kubb.config.ts` — Kubb plugin configuration.
- `package.json` `sdk:generate` script.
- `scripts/check-sdk-drift.sh` (in `patch-careers-ui` root) — drift detection.
- `src/generated/.swagger-hash` — SHA256 of the swagger file at last regen.
- `../profile-services/scripts/generate-swagger-from-decorators.ts` — upstream generator (backend repo).
