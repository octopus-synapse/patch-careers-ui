#!/usr/bin/env bun

// Prunes scripts/i18n-pending-sweep.json down to keys whose hardcoded
// literals still appear in scripts/check-i18n-hardcoded.baseline.json
// after the source sweep. Matching is by (file, value) — line/col may
// shift after the agent injects imports.
//
// One-shot — run after the sweep + hardcoded rebaseline.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SWEEP_PATH = join(ROOT, 'scripts/i18n-pending-sweep.json');
const BASELINE_PATH = join(ROOT, 'scripts/check-i18n-hardcoded.baseline.json');

interface SweepSource {
  file: string;
  line: number;
  col: number;
  value: string;
  rule: string;
  context: string;
}
interface SweepEntry {
  key: string;
  sources: SweepSource[];
}
interface BaselineEntry {
  key: string; // "file:line:col"
  rule: string;
  context: string;
  value: string;
}

const sweep = JSON.parse(readFileSync(SWEEP_PATH, 'utf8')) as {
  note: string;
  count: number;
  entries: SweepEntry[];
};
const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as {
  count: number;
  entries: BaselineEntry[];
};

// Build a (file, value) set from baseline.
const stillHardcoded = new Set<string>();
for (const e of baseline.entries) {
  const file = e.key.split(':')[0];
  stillHardcoded.add(`${file}::${e.value}`);
}

const kept: SweepEntry[] = [];
const dropped: string[] = [];

for (const entry of sweep.entries) {
  // Keep the entry's sources that are STILL hardcoded (by file+value).
  const survivingSources = entry.sources.filter((s) =>
    stillHardcoded.has(`${s.file}::${s.value}`),
  );
  if (survivingSources.length > 0) {
    kept.push({ key: entry.key, sources: survivingSources });
  } else {
    dropped.push(entry.key);
  }
}

const next = {
  note: sweep.note,
  count: kept.length,
  entries: kept.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)),
};
writeFileSync(SWEEP_PATH, `${JSON.stringify(next, null, 2)}\n`);

console.log(`Pending-sweep pruned:
  kept entries:   ${kept.length}
  removed keys:   ${dropped.length}
  remaining keys:`);
for (const k of kept.map((e) => e.key)) console.log(`    ${k}`);
