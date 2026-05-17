#!/usr/bin/env bun

// i18n locale parity — port of tryna-monorepo's locale-parity.spec.ts.
// Zero-tolerance, no baseline.
//
// Three guarantees:
//   1. Every locale exposes the same flattened key set (no `pt-BR` key
//      missing from `en` and vice-versa).
//   2. Interpolation tokens `{{var}}` match across locales for the same
//      key (same names, same count). Catches drift like
//      `pt-BR: "{{count}} resposta"` vs `en: "{{n}} responses"`.
//   3. No empty string values.
//
// Wired into .precommit.yaml as `i18n-parity`.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOCALES = ['pt-BR', 'en'] as const;
type Locale = (typeof LOCALES)[number];

type FlatLocale = Record<string, string>;

function flatten(obj: Record<string, unknown>, prefix = ''): FlatLocale {
  const out: FlatLocale = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      out[key] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    }
  }
  return out;
}

function loadLocale(locale: Locale): FlatLocale {
  const file = join(ROOT, 'packages/i18n/src/dictionaries', `${locale}.json`);
  return flatten(JSON.parse(readFileSync(file, 'utf8')));
}

const TOKEN_RX = /\{\{(\w+)\}\}/g;

function extractTokens(s: string): string[] {
  const tokens = new Set<string>();
  for (const match of s.matchAll(TOKEN_RX)) {
    if (match[1]) tokens.add(match[1]);
  }
  return [...tokens].sort();
}

function missingKeys(a: FlatLocale, b: FlatLocale): string[] {
  return Object.keys(a)
    .filter((k) => !(k in b))
    .sort();
}

function head(items: readonly string[], max = 25): string {
  const slice = items.slice(0, max);
  const tail = items.length > max ? `\n  ... +${items.length - max} more` : '';
  return slice.length ? `\n  - ${slice.join('\n  - ')}${tail}` : '';
}

const data: Record<Locale, FlatLocale> = {
  'pt-BR': loadLocale('pt-BR'),
  en: loadLocale('en'),
};

const problems: string[] = [];

// 1. Same key set across locales.
for (const a of LOCALES) {
  for (const b of LOCALES) {
    if (a === b) continue;
    const missing = missingKeys(data[a], data[b]);
    if (missing.length) {
      problems.push(`Keys in ${a} but missing in ${b} (${missing.length}):${head(missing)}`);
    }
  }
}

// 2. Same interpolation tokens.
const refKeys = Object.keys(data['pt-BR']);
const tokenMismatches: string[] = [];
for (const key of refKeys) {
  const ptTokens = extractTokens(data['pt-BR'][key] ?? '');
  const enValue = data.en[key];
  if (enValue === undefined) continue; // covered by step 1
  const enTokens = extractTokens(enValue);
  if (ptTokens.length !== enTokens.length || ptTokens.some((t, i) => t !== enTokens[i])) {
    tokenMismatches.push(
      `${key}: pt-BR=[${ptTokens.join(',') || '-'}] vs en=[${enTokens.join(',') || '-'}]`,
    );
  }
}
if (tokenMismatches.length) {
  problems.push(
    `Interpolation token mismatch (${tokenMismatches.length}):${head(tokenMismatches)}`,
  );
}

// 3. No empty string values.
const empties: string[] = [];
for (const locale of LOCALES) {
  for (const [k, v] of Object.entries(data[locale])) {
    if (v.trim() === '') empties.push(`${locale}:${k}`);
  }
}
if (empties.length) {
  problems.push(`Empty translation values (${empties.length}):${head(empties)}`);
}

if (problems.length === 0) {
  console.log('i18n-parity: OK');
  process.exit(0);
}

for (const p of problems) {
  console.error(`\n${p}`);
}
console.error(
  '\nFix: add the missing keys, align {{tokens}} between locales, and fill empty strings.',
);
process.exit(1);
