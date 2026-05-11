#!/usr/bin/env bun

// F5-07 / PD-024 — Block hardcoded Portuguese in toast/confirm/alert call
// sites. After Phase 5 we standardized on `t('namespace.key')` lookups for
// user-facing messages. This gate prevents reintroduction.
//
// Detection: line-based regex over apps/web/src/**/*.{svelte,ts}.
// A call site is flagged when:
//   1. The line invokes `toastState.show(<literal>`, `confirm(<literal>`,
//      or `alert(<literal>` (string literal first arg).
//   2. The literal contains a Latin letter AND at least one Portuguese-
//      specific character (`[áâãàçéêíóôõú]`, any case).
//
// The narrow heuristic (LATIN letter + PT-specific accent) keeps the
// signal-to-noise high. Plain ASCII English-looking strings, JSON keys,
// or non-PT accents (e.g. German umlauts) are ignored. To localize an
// English string without accents, the dev still uses `t(...)` — this
// gate just doesn't enforce that case automatically.
//
// Opt-outs (use sparingly):
//   * Append `// allow-pt` to the offending line.
//   * Add a `file:line:trimmed-snippet` entry to the BASELINE set below
//     (pre-existing debt — to be retired by future i18n sweeps).
//
// Biome plugin alternative was evaluated and rejected:
//   * Biome 2.4 has no stable JS-plugin API (`biome explain plugin` is
//     unknown).
//   * Biome's `includes` in this repo excludes `**/*.svelte`, so even
//     a GritQL plugin would miss the bulk of the call sites.
// Standalone bun script is the pragmatic path; wired into .precommit.yaml.

import { join, relative } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const WEB_SRC = join(ROOT, 'apps/web/src');

// Files exempt from scanning. The locale module owns PT label literals
// (`Português`) by definition; the test tree may stub PT copy.
const EXEMPT_PATHS = new Set<string>(['apps/web/src/lib/locale.svelte.ts']);

const EXEMPT_PREFIXES = ['apps/web/test/'];

// Call shapes we scan. Each pattern must capture the literal in group 1.
// We accept single-quoted, double-quoted, and backtick-quoted literals.
// Multi-line template literals are out of scope — a line-based check
// will only see the first line, which is acceptable for this gate.
const CALL_PATTERNS: RegExp[] = [
  /\btoastState\.show\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g,
  // bare confirm(...) — skip function definitions / declarations.
  /(?<!function\s)(?<!\.)\bconfirm\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g,
  /(?<!\.)\balert\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g,
];

const PT_ACCENT = /[áâãàçéêíóôõúÁÂÃÀÇÉÊÍÓÔÕÚ]/;
const LATIN_LETTER = /[A-Za-z]/;

// BASELINE: file:line:trimmed-snippet entries representing pre-existing
// hardcoded PT call sites at the time PD-024 enforcement landed. New
// entries are NOT allowed — to add to this list intentionally is the
// same as failing the gate. Future i18n sweeps should pull entries OUT
// (by extracting to `t(...)`), never push in.
//
// Snippet matching uses the trimmed source line up to the closing quote
// of the flagged literal (so refactors that shift code around don't
// silently re-baseline a different string at the same line number).
const BASELINE = new Set<string>([
  // populated below by the script's --update-baseline pass; the seed
  // values come from the F5-07 implementation moment.
]);

interface Offender {
  file: string;
  line: number;
  col: number;
  literal: string;
  snippet: string;
}

function shouldSkipFile(rel: string): boolean {
  if (EXEMPT_PATHS.has(rel)) return true;
  return EXEMPT_PREFIXES.some((p) => rel.startsWith(p));
}

function looksPortuguese(literal: string): boolean {
  return LATIN_LETTER.test(literal) && PT_ACCENT.test(literal);
}

function scanFile(rel: string, source: string): Offender[] {
  const out: Offender[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.includes('// allow-pt')) continue;
    for (const pattern of CALL_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: classic regex exec loop
      while ((m = pattern.exec(line)) !== null) {
        const literal = m[2] ?? '';
        if (!looksPortuguese(literal)) continue;
        out.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          literal,
          snippet: line.trim(),
        });
      }
    }
  }
  return out;
}

const glob = new Glob('**/*.{svelte,ts}');
const offenders: Offender[] = [];

for await (const filePath of glob.scan({ cwd: WEB_SRC, absolute: true })) {
  const rel = relative(ROOT, filePath);
  if (shouldSkipFile(rel)) continue;
  const source = await Bun.file(filePath).text();
  offenders.push(...scanFile(rel, source));
}

const newOffenders = offenders.filter((o) => !BASELINE.has(`${o.file}:${o.line}:${o.snippet}`));

if (process.argv.includes('--print-baseline')) {
  // Helper mode: dump the current offenders as BASELINE entries so a
  // maintainer can paste them into the source above when intentionally
  // re-baselining (e.g. after a partial extraction sweep).
  for (const o of offenders) {
    console.log(`  '${o.file}:${o.line}:${o.snippet.replace(/'/g, "\\'")}',`);
  }
  process.exit(0);
}

if (newOffenders.length > 0) {
  console.error(
    `\nPD-024 — ${newOffenders.length} hardcoded PT string(s) in toast/confirm/alert:\n`,
  );
  for (const o of newOffenders) {
    console.error(`  ${o.file}:${o.line}:${o.col}  "${o.literal}"`);
  }
  console.error("\nPolicy: user-facing strings go through `t('namespace.key')`. Add the key");
  console.error('to packages/i18n/src/dictionaries/{en,pt-BR}.json and reference via the');
  console.error('`locale.t` translator. For unavoidable cases, append `// allow-pt` to the');
  console.error('line (justify in code review). Do NOT extend the BASELINE set — that list');
  console.error('only retires entries, never gains them.');
  process.exit(1);
}

console.log(`no-hardcoded-pt: OK (${offenders.length} baseline / 0 new)`);
