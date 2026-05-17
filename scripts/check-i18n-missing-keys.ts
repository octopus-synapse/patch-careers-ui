#!/usr/bin/env bun

// i18n missing-key gate — companion to `lint-unused-i18n` (orphans in dict)
// and `check-i18n-parity` (drift between locales).
//
// Scans source for `t('namespace.key')` and `t(\`prefix.${var}\`)` references
// and asserts that:
//   1. Every literal key has a string value in BOTH pt-BR.json and en.json
//      (so `t(...)` never renders the bare key path to the user).
//   2. Dynamic-prefix references (`t(\`foo.${kind}\`)`) point at a non-empty
//      subtree under `foo.*` in both locales — we can't prove every dynamic
//      branch resolves, but an empty subtree means certain rendering bugs.
//
// Zero-tolerance, no baseline. Wired into .precommit.yaml as `i18n-missing`.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const SOURCES = ['apps/web/src/**/*.{ts,svelte}', 'packages/ui/src/**/*.{ts,svelte}'];
const LOCALES = ['pt-BR', 'en'] as const;

function flatten(obj: Record<string, unknown>, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(path, v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [kk, vv] of flatten(v as Record<string, unknown>, path)) out.set(kk, vv);
    }
  }
  return out;
}

const dicts = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    flatten(
      JSON.parse(readFileSync(join(ROOT, 'packages/i18n/src/dictionaries', `${l}.json`), 'utf8')),
    ),
  ]),
) as Record<(typeof LOCALES)[number], Map<string, string>>;

const literalRe = /\bt\(\s*['"`]([a-zA-Z][a-zA-Z0-9_.-]+)['"`]/g;
const dynamicPrefixRe = /\bt\(\s*`([a-zA-Z][a-zA-Z0-9_.-]+)\.\$\{/g;

interface MissRecord {
  key: string;
  file: string;
  line: number;
  col: number;
  locale: string;
}

const literalMisses: MissRecord[] = [];
const prefixMisses: MissRecord[] = [];

function lineColOf(src: string, offset: number): { line: number; col: number } {
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

for (const pattern of SOURCES) {
  const glob = new Glob(pattern);
  for await (const rel of glob.scan({ cwd: ROOT, absolute: false })) {
    if (rel.startsWith('apps/web/src/lib/locale.svelte.ts')) continue;
    const src = readFileSync(join(ROOT, rel), 'utf8');

    literalRe.lastIndex = 0;
    let m: RegExpExecArray | null;
    while (true) {
      m = literalRe.exec(src);
      if (!m) break;
      const key = m[1];
      const offset = m.index + m[0].indexOf(key);
      const { line, col } = lineColOf(src, offset);
      for (const locale of LOCALES) {
        const value = dicts[locale].get(key);
        if (value === undefined) literalMisses.push({ key, file: rel, line, col, locale });
      }
    }

    dynamicPrefixRe.lastIndex = 0;
    while (true) {
      m = dynamicPrefixRe.exec(src);
      if (!m) break;
      const prefix = m[1];
      const offset = m.index + m[0].indexOf(prefix);
      const { line, col } = lineColOf(src, offset);
      for (const locale of LOCALES) {
        const hasAny = [...dicts[locale].keys()].some(
          (k) => k === prefix || k.startsWith(`${prefix}.`),
        );
        if (!hasAny) prefixMisses.push({ key: `${prefix}.*`, file: rel, line, col, locale });
      }
    }
  }
}

function fmt(r: MissRecord): string {
  return `  ${r.file}:${r.line}:${r.col} [${r.locale}] ${r.key}`;
}

const total = literalMisses.length + prefixMisses.length;
if (total === 0) {
  console.log(`check-i18n-missing: OK (0 missing keys, 0 missing prefix subtrees)`);
  process.exit(0);
}

if (literalMisses.length > 0) {
  console.error(`\n${literalMisses.length} t('key') reference(s) without a dict entry:`);
  for (const r of literalMisses.slice(0, 40)) console.error(fmt(r));
  if (literalMisses.length > 40) console.error(`  ... +${literalMisses.length - 40} more`);
}
if (prefixMisses.length > 0) {
  console.error(`\n${prefixMisses.length} t(\`prefix.\${...}\`) reference(s) with empty subtree:`);
  for (const r of prefixMisses.slice(0, 40)) console.error(fmt(r));
  if (prefixMisses.length > 40) console.error(`  ... +${prefixMisses.length - 40} more`);
}
console.error('\nFix: add the missing key in BOTH packages/i18n/src/dictionaries/{pt-BR,en}.json.');
process.exit(1);
