#!/usr/bin/env bun
/**
 * The Kubb-generated SDK ships through two public entry points:
 *
 *   import { ... } from 'api-client';        // root re-export
 *   import { ... } from 'api-client/zod';    // generated Zod schemas
 *
 * Deep imports into `api-client/src/generated/**` are forbidden in
 * application code: they couple the consumer to file paths that are
 * regenerated from scratch on every backend change, and they bypass
 * the curated re-exports in `src/index.ts`. When the SDK is
 * regenerated, a deep import is the kind of breakage that doesn't
 * surface until someone runs that page.
 *
 * The lint forbids `from 'api-client/src/...'` /
 * `from 'api-client/generated/...'` in `apps/**` and `packages/**`,
 * with the exception of:
 *
 *   - `packages/api-client/**` itself (its own internals)
 *   - documentation (`*.md`, `CLAUDE.md`)
 *
 * Run: bun run scripts/lint-no-api-client-deep-imports.ts
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const ROOTS = ['apps', 'packages'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.svelte-kit']);

const DEEP_IMPORT_RE =
  /from\s+['"`](?:[^'"`\s]*api-client\/(?:src\/|generated\/)[^'"`]*|api-client\/(?!zod\b)[^'"`]+)['"`]/g;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) yield* walk(full);
    else if (
      entry.endsWith('.ts') ||
      entry.endsWith('.tsx') ||
      entry.endsWith('.svelte') ||
      entry.endsWith('.js')
    )
      yield full;
  }
}

type Offense = { file: string; line: number; spec: string };
const offenses: Offense[] = [];

for (const r of ROOTS) {
  for (const file of walk(join(ROOT, r))) {
    const rel = relative(ROOT, file);
    if (rel.startsWith('packages/api-client/')) continue;
    const src = readFileSync(file, 'utf8');
    DEEP_IMPORT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    // biome-ignore lint/suspicious/noAssignInExpressions: regex.exec idiom
    while ((m = DEEP_IMPORT_RE.exec(src)) !== null) {
      const line = src.slice(0, m.index).split('\n').length;
      offenses.push({ file: rel, line, spec: m[0].slice(6, -1) });
    }
  }
}

if (offenses.length === 0) {
  console.log('lint-no-api-client-deep-imports: 0 violations');
  process.exit(0);
}
console.error(`lint-no-api-client-deep-imports: ${offenses.length} violation(s):`);
for (const o of offenses) console.error(`  ${o.file}:${o.line}  from '${o.spec}'`);
console.error(
  "\nUse `from 'api-client'` (root re-export) or `from 'api-client/zod'` (generated Zod). " +
    'The generated tree is regenerated from scratch on every backend change — deep imports break silently.',
);
process.exit(1);
