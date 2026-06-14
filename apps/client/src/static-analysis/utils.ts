/**
 * i18n static-analysis utilities — shared by the parity and
 * hardcoded-string specs. Ported from tryna-monorepo's i18n suite and
 * adapted: dictionaries here are TS objects (`ptBR`/`en` from
 * `@patch-careers/i18n`) and interpolation tokens use single braces
 * (`{name}`, see `interpolate` in packages/i18n).
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type FlatLocale = Record<string, string>;

/**
 * Flattens a nested dictionary into dot-notation keys.
 * `{ a: { b: 'x' } }` → `{ 'a.b': 'x' }`.
 */
export function flattenKeys(obj: Record<string, unknown>, prefix = ""): FlatLocale {
  const out: FlatLocale = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out[key] = v;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v as Record<string, unknown>, key));
    }
  }
  return out;
}

const TOKEN_RX = /\{(\w+)\}/g;

/** Extracts `{name}` interpolation tokens, sorted and deduped. */
export function extractTokens(s: string): string[] {
  const tokens = new Set<string>();
  for (const match of s.matchAll(TOKEN_RX)) {
    if (match[1]) tokens.add(match[1]);
  }
  return [...tokens].sort();
}

/** Keys present in `a` but missing from `b`. */
export function missingKeys(a: FlatLocale, b: FlatLocale): string[] {
  return Object.keys(a)
    .filter((k) => !(k in b))
    .sort();
}

/**
 * Recursively collects .ts/.tsx under `dir`, excluding build output,
 * tests/stories and this static-analysis suite itself.
 */
export function readAllSourceFiles(
  dir: string,
  files: string[] = [],
  excludeDirs: Set<string> = new Set([
    "node_modules",
    "dist",
    "build",
    ".expo",
    "__tests__",
    "static-analysis",
  ]),
): string[] {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludeDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      readAllSourceFiles(full, files, excludeDirs);
    } else if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !/\.(spec|test|stories)\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(full);
    }
  }
  return files;
}
