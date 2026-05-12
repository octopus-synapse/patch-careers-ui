#!/usr/bin/env bun
/**
 * Cat 5 #3 (frontend): source files >500 lines tend to do too much.
 * Soft signal, baseline-ratchet: capture today's offenders, fail when
 * the set grows OR when an existing offender adds lines.
 *
 * Scope: `apps/web/src/**\/*.{ts,svelte}` and `packages/ui/src/**\/*.{ts,svelte}`,
 * excluding specs / tests / generated.
 *
 * Files that legitimately can't shrink (large mock data, generated
 * lookup) carry `// lint-allow-file-size: <reason>` near the top.
 *
 * Run: bun run scripts/lint-file-size.ts
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const SCAN_ROOTS = ['apps/web/src', 'packages/ui/src'];
const LIMIT = 500;
const BASELINE_PATH = resolve(ROOT, 'scripts/lint-file-size.baseline.txt');
const ESCAPE_RE = /lint-allow-file-size:\s*\S/;
const SKIP_DIRS = new Set(['node_modules', 'generated', '.svelte-kit', 'dist', 'build']);

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
      (entry.endsWith('.ts') || entry.endsWith('.svelte')) &&
      !entry.endsWith('.spec.ts') &&
      !entry.endsWith('.test.ts')
    )
      yield full;
  }
}

const current = new Map<string, number>();
for (const r of SCAN_ROOTS) {
  for (const file of walk(join(ROOT, r))) {
    const src = readFileSync(file, 'utf8');
    if (ESCAPE_RE.test(src.slice(0, 800))) continue;
    const lines = src.split('\n').length;
    if (lines > LIMIT) current.set(relative(ROOT, file), lines);
  }
}

const baselineEntries = (): Map<string, number> => {
  if (!existsSync(BASELINE_PATH)) return new Map();
  const out = new Map<string, number>();
  for (const row of readFileSync(BASELINE_PATH, 'utf8').split('\n')) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    const [path, nStr] = trimmed.split('\t');
    if (path && nStr) out.set(path, Number(nStr));
  }
  return out;
};

if (process.env.UPDATE_BASELINE === '1') {
  const lines = [...current.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([p, n]) => `${p}\t${n}`);
  writeFileSync(BASELINE_PATH, `${lines.join('\n')}\n`);
  console.log(`[file-size] baseline updated to ${current.size} file(s)`);
  process.exit(0);
}

const baseline = baselineEntries();
const newOffenders: string[] = [];
const grown: string[] = [];
for (const [path, n] of current) {
  const prior = baseline.get(path);
  if (prior === undefined) newOffenders.push(`${path} (${n} lines)`);
  else if (n > prior) grown.push(`${path} (${prior} → ${n} lines)`);
}

if (newOffenders.length === 0 && grown.length === 0) {
  console.log(`lint-file-size: ${current.size} file(s) over ${LIMIT} (matches baseline)`);
  process.exit(0);
}

if (newOffenders.length > 0) {
  console.error(`lint-file-size: ${newOffenders.length} new file(s) over ${LIMIT} lines:`);
  for (const o of newOffenders) console.error(`  ${o}`);
}
if (grown.length > 0) {
  console.error(`lint-file-size: ${grown.length} existing offender(s) grew:`);
  for (const o of grown) console.error(`  ${o}`);
}
console.error(
  `\nSplit the file, extract sub-modules / sub-components, or — if the size is intrinsic — ` +
    `add \`// lint-allow-file-size: <reason>\` near the top.`,
);
process.exit(1);
