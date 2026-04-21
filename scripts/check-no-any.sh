#!/usr/bin/env bash
# Fails if any source file contains `: any` or `as any`.
#
# Why this script and not biome: biome can't lint .svelte files, so its
# `noExplicitAny` rule (already configured for .ts) doesn't reach the script
# blocks inside Svelte components. This grep covers the gap.
#
# Excluded paths:
#   - node_modules, .svelte-kit, build, dist, generated  (not our code)
#   - this script itself                                  (so the regex doesn't self-match)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Match `: any` (with word boundary) or `as any` outside identifiers.
PATTERN=':[[:space:]]*any\b|as[[:space:]]+any\b'

# Skip comment lines (starting with //, *, or pure backtick docs) so prose
# referencing the word "any" in a JSDoc/explanatory comment doesn't trip us.
matches=$(grep -RnE "${PATTERN}" \
  --include='*.ts' --include='*.tsx' --include='*.svelte' \
  --exclude-dir=node_modules \
  --exclude-dir=.svelte-kit \
  --exclude-dir=build \
  --exclude-dir=dist \
  --exclude-dir=generated \
  --exclude-dir=.turbo \
  --exclude='check-no-any.sh' \
  "$ROOT/apps" "$ROOT/packages" 2>/dev/null \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|\*|\*/)' \
  || true)

if [ -n "$matches" ]; then
  echo "✗ Found explicit \`any\` usage. Replace with proper types." >&2
  echo "$matches" >&2
  exit 1
fi

echo "✓ No explicit \`any\` found"
