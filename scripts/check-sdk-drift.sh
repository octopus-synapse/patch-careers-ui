#!/bin/sh
# Drift gate: refuse to commit if profile-services/client-swagger.json
# changed without a matching SDK regeneration.
#
# We hash the current swagger and compare with the snapshot stored at
# packages/api-client/src/generated/.swagger-hash. Mismatch → run
# `bun run sdk:generate` and re-stage.

set -e

SWAGGER="../profile-services/client-swagger.json"
HASH_FILE="packages/api-client/src/generated/.swagger-hash"

if [ ! -f "$SWAGGER" ]; then
  echo "drift: $SWAGGER not found — backend not in monorepo or path moved." >&2
  exit 0
fi

current=$(sha256sum "$SWAGGER" | cut -d' ' -f1)

if [ ! -f "$HASH_FILE" ]; then
  echo "drift: $HASH_FILE missing. Run 'cd packages/api-client && bun run sdk:generate' to seed it." >&2
  exit 1
fi

stored=$(cat "$HASH_FILE")

if [ "$current" != "$stored" ]; then
  echo "drift: SDK is stale relative to client-swagger.json." >&2
  echo "       expected: $stored" >&2
  echo "       actual:   $current" >&2
  echo "" >&2
  echo "Run: cd packages/api-client && bun run sdk:generate" >&2
  echo "Then re-stage the regenerated files." >&2
  exit 1
fi
