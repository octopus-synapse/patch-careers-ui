#!/usr/bin/env bun

// check-no-inline-style.ts
//
// Pre-commit gate: refuse to commit a NEW `style="..."` inline-style
// attribute or `<style>` block in any `.svelte` file under `apps/` or
// `packages/`. Pre-existing debt lives in
// `scripts/check-no-inline-style.baseline.json`; new entries are
// reported and block the commit.
//
// Why: the team policy is Tailwind utilities + Svelte variants only.
// Inline styles and scoped <style> blocks bypass design tokens and
// break theming. See ~/.claude/.../feedback_no_inline_style.md.
//
// Auto-prune model is the same as check-i18n-hardcoded.ts:
//   - Match key is `${file}::${kind}` (NOT line:col) so reordering
//     doesn't reshuffle baseline state. Multiple occurrences of the
//     same kind in the same file are tracked by count.
//   - On each run:
//       live[k] > baseline[k]   → (live − baseline) NEW violations.
//       live[k] ≤ baseline[k]   → no new; baseline shrinks by the
//                                  surplus.
//     - 0 NEW → rewrite baseline in place with the current snapshot
//       (auto-prune). Exit 0.
//     - ≥1 NEW → report and exit 1 WITHOUT touching the baseline.
//
//   --update-baseline forces a full rewrite (escape hatch for
//   intentional bulk edits).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const SCAN_ROOTS = ['apps', 'packages'];
const BASELINE_PATH = join(ROOT, 'scripts/check-no-inline-style.baseline.json');
const UPDATE = process.argv.includes('--update-baseline');

const EXEMPT_FILE_PATTERNS: RegExp[] = [
  /\/\.svelte-kit\//,
  /\/node_modules\//,
  /\/build\//,
  /\/dist\//,
  /\/generated\//,
];

type Kind = 'inline-style-attr' | 'style-block';

interface Violation {
  file: string; // repo-relative
  line: number;
  col: number;
  kind: Kind;
  snippet: string;
}

function isExempt(rel: string): boolean {
  return EXEMPT_FILE_PATTERNS.some((re) => re.test(rel));
}

function offsetToLineCol(src: string, offset: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < src.length; i++) {
    if (src[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}

const STYLE_ATTR_RX = /\sstyle="([^"]*)"/g;
const STYLE_BLOCK_RX = /<style\b[^>]*>/g;

function scanFile(rel: string, src: string, out: Violation[]): void {
  STYLE_ATTR_RX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while (true) {
    m = STYLE_ATTR_RX.exec(src);
    if (!m) break;
    const offset = m.index + 1; // skip leading whitespace
    const { line, col } = offsetToLineCol(src, offset);
    const snippet = m[0].trim();
    out.push({
      file: rel,
      line,
      col,
      kind: 'inline-style-attr',
      snippet: snippet.length > 80 ? `${snippet.slice(0, 77)}…` : snippet,
    });
  }

  STYLE_BLOCK_RX.lastIndex = 0;
  while (true) {
    m = STYLE_BLOCK_RX.exec(src);
    if (!m) break;
    const { line, col } = offsetToLineCol(src, m.index);
    out.push({
      file: rel,
      line,
      col,
      kind: 'style-block',
      snippet: m[0],
    });
  }
}

async function* listFiles(): AsyncGenerator<string> {
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    const glob = new Glob('**/*.svelte');
    for await (const rel of glob.scan({ cwd: abs, absolute: false })) {
      yield join(root, rel);
    }
  }
}

async function detect(): Promise<Violation[]> {
  const violations: Violation[] = [];
  for await (const file of listFiles()) {
    if (isExempt(file)) continue;
    const abs = join(ROOT, file);
    let src: string;
    try {
      src = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    scanFile(file, src, violations);
  }
  violations.sort((a, b) =>
    a.file === b.file
      ? a.line === b.line
        ? a.col - b.col
        : a.line - b.line
      : a.file < b.file
        ? -1
        : 1,
  );
  return violations;
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

interface BaselineEntry {
  key: string; // file:line:col — refreshed every run
  kind: Kind;
  snippet: string;
}

interface BaselineFile {
  note: string;
  count: number;
  byKind: Partial<Record<Kind, number>>;
  byFile: Record<string, number>;
  entries: BaselineEntry[];
}

const NOTE =
  'inline-style violations — surviving debt only. Auto-prunes on every gate run: as soon as a `style=""` attr or `<style>` block is removed, the entry vanishes. New entries are NEVER auto-added — a failing run reports them but leaves this file untouched. To force-rebuild after an intentional bulk edit: bun scripts/check-no-inline-style.ts --update-baseline';

function loadBaselineGroups(): Map<string, number> {
  const groups = new Map<string, number>();
  if (!existsSync(BASELINE_PATH)) return groups;
  let raw: { entries?: BaselineEntry[] };
  try {
    raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return groups;
  }
  for (const e of raw.entries ?? []) {
    const file = e.key.split(':')[0];
    const gk = `${file}::${e.kind}`;
    groups.set(gk, (groups.get(gk) ?? 0) + 1);
  }
  return groups;
}

function groupKey(v: Violation): string {
  return `${v.file}::${v.kind}`;
}

function writeBaseline(violations: Violation[]): void {
  const entries: BaselineEntry[] = violations.map((v) => ({
    key: `${v.file}:${v.line}:${v.col}`,
    kind: v.kind,
    snippet: v.snippet,
  }));
  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  const byKind: Partial<Record<Kind, number>> = {};
  const byFile: Record<string, number> = {};
  for (const e of entries) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    const file = e.key.split(':')[0];
    byFile[file] = (byFile[file] ?? 0) + 1;
  }
  const sortedByFile = Object.fromEntries(
    Object.entries(byFile).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)),
  );

  const payload: BaselineFile = {
    note: NOTE,
    count: entries.length,
    byKind,
    byFile: sortedByFile,
    entries,
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function readExisting(): string {
  if (!existsSync(BASELINE_PATH)) return '';
  try {
    return readFileSync(BASELINE_PATH, 'utf8');
  } catch {
    return '';
  }
}

function format(v: Violation): string {
  return `  ${v.file}:${v.line}:${v.col} [${v.kind}] ${v.snippet}`;
}

const violations = await detect();

if (UPDATE) {
  writeBaseline(violations);
  console.log(`check-no-inline-style: baseline rewritten with ${violations.length} entries`);
  process.exit(0);
}

const expected = loadBaselineGroups();
const liveCounts = new Map<string, number>();
const liveByGroup = new Map<string, Violation[]>();
for (const v of violations) {
  const gk = groupKey(v);
  liveCounts.set(gk, (liveCounts.get(gk) ?? 0) + 1);
  const list = liveByGroup.get(gk) ?? [];
  list.push(v);
  liveByGroup.set(gk, list);
}

const newViolations: Violation[] = [];
for (const [gk, list] of liveByGroup) {
  const allowed = expected.get(gk) ?? 0;
  if (list.length > allowed) newViolations.push(...list.slice(allowed));
}

const kindCounts: Record<string, number> = {};
for (const v of violations) kindCounts[v.kind] = (kindCounts[v.kind] ?? 0) + 1;
const summary = Object.entries(kindCounts)
  .map(([k, n]) => `${k}=${n}`)
  .join(', ');

if (newViolations.length === 0) {
  const before = readExisting();
  writeBaseline(violations);
  const after = readExisting();
  if (before !== after) {
    let dropped = 0;
    for (const [gk, exp] of expected) {
      const live = liveCounts.get(gk) ?? 0;
      if (live < exp) dropped += exp - live;
    }
    console.log(
      `check-no-inline-style: OK (${violations.length} baseline / 0 new) [${summary || '-'}]\n` +
        `  auto-pruned: baseline rewritten (${dropped} entr${dropped === 1 ? 'y' : 'ies'} dropped or shifted)`,
    );
  } else {
    console.log(
      `check-no-inline-style: OK (${violations.length} baseline / 0 new) [${summary || '-'}]`,
    );
  }
  process.exit(0);
}

console.error(
  `\ncheck-no-inline-style: ${newViolations.length} NEW inline-style violation(s) [${summary}]:\n`,
);
for (const v of newViolations.slice(0, 60)) console.error(format(v));
if (newViolations.length > 60) console.error(`  ... +${newViolations.length - 60} more`);
console.error(
  '\nFix: replace `style="..."` with Tailwind utilities (e.g. `class="text-[var(--x)] bg-red-500"`),\n' +
    'or use Svelte `style:property={expr}` directives for interpolated values.\n' +
    'For static animations / keyframes, move them to `apps/web/src/app.css` (global).\n' +
    'For intentional debt, run: bun scripts/check-no-inline-style.ts --update-baseline\n' +
    `(_used in: ${relative(ROOT, ROOT)}_)\n`,
);
process.exit(1);
